import { get } from 'svelte/store';
import type { Action } from 'svelte/action';

import type { TooltipSettings, ComputePositionReturn, TooltipState } from '$lib/tooltip/types';
import { storePopup } from '@skeletonlabs/skeleton';

// Use a store to pass the Floating UI import references
// Progrmamtic Tooltip Discussion: https://github.com/skeletonlabs/skeleton/issues/1484
// Stackblitz: https://stackblitz.com/edit/skeletonlabs-repl-piksa3?file=src%2Froutes%2F%2Bpage.svelte

// Testing; https://stackblitz.com/edit/skeletonlabs-repl-luhom4?file=src%2Froutes%2F%2Blayout.svelte,src%2Froutes%2F%2Bpage.svelte
export const tooltip: Action<HTMLElement, TooltipSettings | undefined> = (
	triggerNode,
	customParams
) => {
	let elemTooltip: HTMLElement;
	let elemArrow: HTMLElement;
	let content: any;
	let explicitTooltip: HTMLElement | null = null;
	let prevElemTooltip: HTMLElement | null;
	let cloneElemTooltip: HTMLElement | null;
	let prevElemArrow: HTMLElement | null;
	let clickTimer: number;
	const focusableAllowedList =
		':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';
	let focusableTooltipElements;
	const documentationLink = 'https://www.skeleton.dev/utilities/tooltips'; // TODO: fix link

	// Floating UI Modules
	const {
		computePosition,
		autoUpdate,
		offset,
		shift,
		flip,
		arrow,
		size,
		autoPlacement,
		hide,
		inline
	} = get(storePopup);

	let params: Required<TooltipSettings> = {
		content: customParams?.content ?? '',
		event: customParams?.event ?? 'hover',
		placement: customParams?.placement ?? 'top',
		tooltipClass:
			customParams?.tooltipClass ??
			'card z-99 !ring-1 !ring-primary-500 rounded-xl px-2 py-1 text-sm shadow-xl',
		includeArrow: customParams?.includeArrow ?? true,
		arrowClass: customParams?.arrowClass ?? '',
		componentState: customParams?.componentState ?? {},
		open: customParams?.open ?? false,
		uuid: customParams?.uuid ?? crypto.randomUUID().slice(0, 5),
		disabled: customParams?.disabled ?? false,
		linkDisabledToTrigger: customParams?.linkDisabledToTrigger ?? true,
		linkTriggers: customParams?.linkTriggers ?? false,
		closeQuery: customParams?.closeQuery ?? 'a[href], button',
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		state: customParams?.state ?? (() => {}),
		middleware: customParams?.middleware ?? {},
		longPressDuration: customParams?.longPressDuration ?? 500,
		transition: {
			default: customParams?.transition?.default ?? true,
			duration: customParams?.transition?.duration ?? 1000 /* slow on purpose for testing */,
			function: customParams?.transition?.function ?? 'ease-in-out',
			delayin: customParams?.transition?.delayin ?? 500,
			delayout: customParams?.transition?.delayout ?? 100
			// TODO: hover vs others defaults, hover should be a little longer to prevent flybys, others a little short to seem responsive
		}
	};

	const { delayin, delayout } = params.transition;

	/*	TODO: custom transitons	*/

	// Local State
	const localState: TooltipState = {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		autoUpdateCleanup: () => null
	};

	// Create Tooltip DOM Elements
	setDomElements();
	// Render tooltip on initialization
	renderTooltip();
	// Open on initialization if params.open
	if (params.open) setTimeout(() => open(false), delayin);

	function setDomElements() {
		// content priority: params.content > title > aria-label
		content = params.content || triggerNode.title || triggerNode.getAttribute('aria-label') || '';

		// Test for existing explicitly created tooltip in HTML template based on content referencing data-popup id string, and positioned immediately following triggerNode
		if (typeof content === 'string') {
			// content param could contain quotes if it is actual string content (rather than a reference),
			// so to prevent crash remove any quotes from content to avoid selector error
			const nextSibling = triggerNode.nextElementSibling;
			if (nextSibling && nextSibling.getAttribute('data-popup') === content.replace(/[`"']/g, ''))
				explicitTooltip = nextSibling as HTMLElement;
			// If explicit tooltip has been found, use it's uuid reference
			if (explicitTooltip) params.uuid = content;
		}

		const elsewhere =
			typeof content === 'string' &&
			document.querySelector(`[data-popup='${content.replace(/[`"']/g, '')}']`);
		if (elsewhere) {
			cloneElemTooltip = elsewhere.cloneNode(true) as HTMLElement;
			params.uuid = content;
		}

		elemTooltip = explicitTooltip ?? cloneElemTooltip ?? document.createElement('div');

		// Remove title, so no interference of native title w/ our tooltip
		triggerNode.removeAttribute('title');

		// identify as a tooltip
		if (!explicitTooltip && !cloneElemTooltip) elemTooltip.setAttribute('data-popup', params.uuid);

		// Turn off pointer node events of children of elemTrigger for hover (anti-flicker)
		// see https://www.skeleton.dev/utilities/popups#hover
		if (params.event === 'hover') triggerNode.classList.add('[&>*]:pointer-events-none');
		else triggerNode.classList.remove('[&>*]:pointer-events-none');

		// Add aria attributes for A11y
		if (
			!triggerNode.getAttribute('aria-label') /*
			!explicitTooltip &&
			typeof content === 'string' &&
			!(content.includes('<') && content.includes('>')) */
		)
			triggerNode.setAttribute('aria-label', content);
		triggerNode.setAttribute('aria-describedby', `tooltip-${params.uuid}`);
		elemTooltip.setAttribute('role', 'tooltip');

		// Apply reasonable default fade in/out transition
		elemTooltip.style.display = 'block';
		elemTooltip.style.opacity = params.open ? '1' : '0';
		if (params.transition.default) {
			elemTooltip.style.transition = 'opacity';
			elemTooltip.style.transitionDelay = '250ms';
			elemTooltip.style.transitionDuration = `${params.transition.duration}ms`;
			// note delayin and delayout handled by eventHandlers
		}

		// Add content to tooltip
		if (typeof content === 'string' && !explicitTooltip && !cloneElemTooltip)
			elemTooltip.innerHTML = content;

		// Apply custom tooltip classes
		elemTooltip.className = (`tooltip-${params.uuid} ` + params.tooltipClass).trim();

		// Add tooltip to DOM
		if (!explicitTooltip)
			(triggerNode.parentNode as HTMLElement).insertBefore(elemTooltip, triggerNode.nextSibling);
		if (!prevElemTooltip && isSvelteComponent(content)) {
			new content({
				target: elemTooltip as HTMLElement,
				props: params.componentState
			});
		}
	}

	// Render Floating UI Popup
	function renderTooltip() {
		if (!content) return;
		console.log('render');

		// Floating UI Compute Position
		['computePosition', 'offset', 'shift', 'flip', 'arrow'].forEach((mw) => {
			if (!eval(mw))
				throw new Error(
					`Floating UI '${mw}' not found for content idenitified by data-popup=["${params.uuid}"]. ${documentationLink}`
				);
		});

		// Bundle optional middleware
		const optionalMiddleware = [];
		// https://floating-ui.com/docs/size
		if (size) optionalMiddleware.push(size(params.middleware?.size));
		// https://floating-ui.com/docs/autoPlacement
		if (autoPlacement) optionalMiddleware.push(autoPlacement(params.middleware?.autoPlacement));
		// https://floating-ui.com/docs/hide
		if (hide) optionalMiddleware.push(hide(params.middleware?.hide));
		// https://floating-ui.com/docs/inline
		if (inline) optionalMiddleware.push(inline(params.middleware?.inline));
		// Floating UI Compute Position
		// https://floating-ui.com/docs/computePosition
		// Error below happened with addition tick();
		computePosition(triggerNode, elemTooltip, {
			placement: params.placement,
			// Middleware - NOTE: the order matters:
			// https://floating-ui.com/docs/middleware#ordering
			middleware: [
				// https://floating-ui.com/docs/offset
				offset(params.middleware?.offset ?? 8),
				// https://floating-ui.com/docs/shift
				shift(params.middleware?.shift ?? { padding: 8 }),
				// https://floating-ui.com/docs/flip
				flip(params.middleware?.flip),
				// https://floating-ui.com/docs/arrow
				arrow(params.middleware?.arrow ?? { element: elemArrow || null }),
				// Implement optional middleware
				...optionalMiddleware
			]
		}).then(({ x, y, placement: finalPlacement, middlewareData }: ComputePositionReturn) => {
			Object.assign(elemTooltip.style, {
				left: `${x}px`,
				top: `${y}px`
			});

			// Handle Arrow Placement: https://floating-ui.com/docs/arrow
			if (!params?.includeArrow) {
				// remove prior arrow
				document.querySelector(`.arrow-${params.uuid}`)?.remove();
			} else {
				prevElemArrow = elemTooltip.querySelector(`.arrow-${params.uuid}`);
				elemArrow = prevElemArrow ?? document.createElement('div');
				elemArrow.setAttribute('role', 'tooltip');

				const { x: arrowX, y: arrowY } = middlewareData.arrow;
				const staticSide = {
					top: 'bottom',
					right: 'left',
					bottom: 'top',
					left: 'right'
				}[finalPlacement.split('-')[0] as string];
				Object.assign(elemArrow.style, {
					left: arrowX != null ? `${arrowX}px` : '',
					top: arrowY != null ? `${arrowY}px` : '',
					right: '',
					bottom: '',
					[staticSide as string]: '-4px'
				});

				elemArrow.setAttribute('id', `arrow-${params.uuid}`);
				elemArrow.style.setProperty('background-color', 'inherit');
				elemArrow.style.setProperty('z-index', 'inherit');

				// box-shadow and border need modified, so can't simply be inherited
				const border = window
					.getComputedStyle(elemTooltip as HTMLElement, null)
					.getPropertyValue('border');
				let ring = window
					.getComputedStyle(elemTooltip as HTMLElement, null)
					.getPropertyValue('box-shadow');
				if (ring) {
					// apply box-shadow only to arrow box outside popup
					const rings = ring.split(/,\s(?![\d])/);
					let parts = rings[1].trim().split(' ');
					const rgb = parts.slice(0, 3).join(' ');
					parts = parts.slice(3);
					if (finalPlacement.includes('top')) {
						parts[0] = parts[1] = '-' + parts[3];
					} else if (finalPlacement.includes('right')) {
						parts[0] = parts[3];
						parts[1] = '-' + parts[3];
					} else if (finalPlacement.includes('bottom')) {
						parts[0] = parts[1] = parts[3];
					} else if (finalPlacement.includes('left')) {
						parts[0] = '-' + parts[3];
						parts[1] = parts[3];
					}
					rings[1] = rgb + ' ' + parts.join(' ');
					ring = rings.join(', ');
					elemArrow.style.setProperty('box-shadow', ring);
				}
				if (border) {
					// apply borders only to arrow box outside popup
					if (finalPlacement.includes('top')) {
						elemArrow.style.setProperty('border-bottom', border);
						elemArrow.style.setProperty('border-right', border);
					} else if (finalPlacement.includes('right')) {
						elemArrow.style.setProperty('border-bottom', border);
						elemArrow.style.setProperty('border-left', border);
					} else if (finalPlacement.includes('bottom')) {
						elemArrow.style.setProperty('border-top', border);
						elemArrow.style.setProperty('border-left', border);
					} else if (finalPlacement.includes('left')) {
						elemArrow.style.setProperty('border-top', border);
						elemArrow.style.setProperty('border-right', border);
					}
				}

				// Apply arrow classes
				elemArrow.className = (`arrow arrow-${params.uuid} ` + params.arrowClass).trim();

				// Add arrow to DOM
				if (!prevElemArrow) elemTooltip.appendChild(elemArrow);
			}
		});
	}

	// State Handlers - emit (from action update) used to prevent infinite loop
	function open(emit = true) {
		// Set open state to on
		localState.open = true;
		// Return the current state
		if (params.state) params.state({ state: localState.open });
		// Update render settings, it might have moved.
		renderTooltip();

		const tts = params.linkTriggers
			? [...document.querySelectorAll(`[data-popup='${params.uuid}']`)]
			: [elemTooltip];
		tts.forEach((elem) => {
			// Check for disabled
			// TODO: fix type error below
			if (params?.disabled || (params.linkDisabledToTrigger && triggerNode.disabled)) return;
			// Update the DOM
			(elem as HTMLElement).style.opacity = '1';
			// elem.style.display = 'block';
			(elem as HTMLElement).style.pointerEvents = 'auto';
			// Enable popup interactions
			elem.removeAttribute('inert');
			// Trigger Floating UI autoUpdate (open only) - tooltip follows scroll/resize
			// https://floating-ui.com/docs/autoUpdate
			// without emit, this causes infinite loop
			if (emit)
				localState.autoUpdateCleanup = autoUpdate(triggerNode, elem as HTMLElement, renderTooltip);
			// Focus the first focusable element within the popup
			focusableTooltipElements = Array.from(
				(elem as HTMLElement)?.querySelectorAll(focusableAllowedList)
			);
			// Update the outside triggerNode customEvents
			fireCustomEvent(triggerNode, 'toggle', { state: localState.open });
			fireCustomEvent(triggerNode, 'open', {
				state: localState.open
			});
			/*			// Update the DOM
			elemTooltip.style.opacity = '1';
			// elemTooltip.style.display = 'block';
			elemTooltip.style.pointerEvents = 'auto';
			// Enable popup interactions
			elemTooltip.removeAttribute('inert');
			// Trigger Floating UI autoUpdate (open only) - tooltip follows scroll/resize
			// https://floating-ui.com/docs/autoUpdate
			// without emit, this causes infinite loop
			if (emit) localState.autoUpdateCleanup = autoUpdate(triggerNode, elemTooltip, renderTooltip);
			// Focus the first focusable element within the popup
			focusableTooltipElements = Array.from(elemTooltip?.querySelectorAll(focusableAllowedList));
			// Update the outside triggerNode customEvents
			fireCustomEvent(triggerNode, 'toggle', { state: localState.open });
			fireCustomEvent(triggerNode, 'open', {
				state: localState.open
			});*/
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	function close(callback: () => void = () => {}) {
		// Set open state to off
		localState.open = false;
		// Return the current state
		if (params.state) params.state({ state: localState.open });
		const tts = params.linkTriggers
			? [...document.querySelectorAll(`[data-popup='${params.uuid}']`)]
			: [elemTooltip];

		tts.forEach((elem) => {
			// Check for disabled
			// TODO: fix type error
			const triggerElem = triggerNode as HTMLInputElement | HTMLButtonElement;
			if (params?.disabled || (params.linkDisabledToTrigger && triggerElem.disabled)) return;
			// Update the DOM
			(elem as HTMLElement).style.opacity = '0';
			// disable popup interactions
			(elem as HTMLElement).setAttribute('inert', '');
			// Cleanup Floating UI autoUpdate (close only) - tooltip follows scroll/resize
			if (localState.autoUpdateCleanup) localState.autoUpdateCleanup();
			// update the outside triggerNode customEvents
			fireCustomEvent(triggerNode, 'toggle', { state: localState.open });
			fireCustomEvent(triggerNode, 'close', {
				state: localState.open
			});
		});
		// Trigger callback
		if (callback) callback();
	}

	// Event Handlers
	// Keyboard Interactions
	const onWindowKeyDown = (event: KeyboardEvent) => {
		if (localState.open === false) return;
		// Handle keys
		const key = event.key;
		// On Esc key
		if (key === 'Escape') {
			event.preventDefault();
			triggerNode.focus();
			delayedClose();
			return;
		}
		// Update focusable elements (important for Autocomplete)
		focusableTooltipElements = Array.from(elemTooltip.querySelectorAll(focusableAllowedList));
		// On Tab or ArrowDown key
		const triggerMenuFocused = localState.open && document.activeElement === triggerNode;
		if (
			triggerMenuFocused &&
			(key === 'ArrowDown' || key === 'Tab') &&
			focusableAllowedList.length > 0 &&
			focusableTooltipElements.length > 0
		) {
			event.preventDefault();
			(focusableTooltipElements[0] as HTMLElement).focus();
		}
	};

	// Event Listeners
	function toggle() {
		localState.open ? delayedClose() : delayedOpen();
	}

	function onWindowClick(event: Event) {
		// Return if the popup is not yet open
		if (localState.open === false) return;
		// Return if click is the trigger element
		if (triggerNode.contains(event.target as HTMLElement)) return;
		// If click it outside the popup
		if (elemTooltip && elemTooltip.contains(event.target as HTMLElement) === false) {
			delayedClose();
			return;
		}
		// Clear longpress if used
		cancelLongpress();
		// Handle Close Query State
		const closableMenuElements = elemTooltip.querySelectorAll(params.closeQuery);
		closableMenuElements?.forEach((elem) => {
			if (elem.contains(event.target as HTMLElement)) close();
		});
	}

	function throttledHover(event: MouseEvent) {
		// this allows scroll overs on the way to something else not to trigger tooltip
		let waitingOnPrior;
		// if already open or already waiting to open return
		if (localState.open || waitingOnPrior) return;
		waitingOnPrior = true;
		setTimeout(() => {
			// after delay, if still hovered then run callback
			if ((event.target as HTMLElement).matches(':hover')) open();
			waitingOnPrior = false;
		}, delayin);
	}

	function rclick(event: MouseEvent) {
		event.preventDefault();
		delayedOpen();
	}

	function delayedClose() {
		setTimeout(() => close(), delayout);
	}

	function delayedOpen() {
		setTimeout(() => open(), delayin);
	}

	function longpress() {
		clickTimer = window.setTimeout(() => {
			toggle();
		}, params.longPressDuration);
	}

	function cancelLongpress() {
		clearTimeout(clickTimer);
	}

	// TODO: mouseout of trigger closes contextmennu, click, others?
	// Event listeners.
	switch (params.event) {
		case 'click':
			triggerNode.addEventListener('click', toggle, true);
			window.addEventListener('click', onWindowClick, true);
			break;
		case 'hover':
			triggerNode.addEventListener('mouseover', throttledHover, true);
			triggerNode.addEventListener('mouseleave', delayedClose, true);
		// let fallthrough so when hover declared, also focus/blur - ally.
		case 'focus-blur':
			triggerNode.addEventListener('focus', toggle, true);
			triggerNode.addEventListener('blur', delayedClose, true);
			break;
		case 'focus-click':
			triggerNode.addEventListener('focus', delayedOpen, true);
			window.addEventListener('click', onWindowClick, true);
			break;
		case 'contextmenu':
			triggerNode.addEventListener('contextmenu', rclick, true),
				window.addEventListener('click', onWindowClick, true);
			break;
		case 'longpress':
			triggerNode.addEventListener('mousedown', longpress, true);
			triggerNode.addEventListener('mouseup', cancelLongpress, true);
			window.addEventListener('click', onWindowClick, true);
			break;
		case 'dblclick':
			triggerNode.addEventListener('dblclick', toggle, true);
			window.addEventListener('click', onWindowClick, true);
			break;
		default:
			throw new Error(`Event value of '${params.event}' is not supported. ${documentationLink}`);
	}
	window.addEventListener('keydown', onWindowKeyDown, true);

	// Lifecycle
	return {
		update: (newParams: any) => {
			// with all the potential param setting changes, it may be too complicated to patch
			// best solution, except for state changes via open, just remove and re-run action?
			// if (newParams.open && newParams.open !== params.open) {
			// 	if (newParams.open) {
			// 		setTimeout(() => open(false), delayin);
			// 	} else delayedClose();
			// 	renderTooltip();
			// } else {
			// 	if (!explicitTooltip) elemTooltip.remove();
			// 	elemArrow.remove();
			// 	tooltip(triggerNode, { ...params, ...newParams, open: newParams.open });
			// }

			// or Only support updates to string type content, custom css for tooltip and arrowm disabled, open.
			// so remainder of settings cannot be updated after init.
			// console.log('update', newParams);
			// Object.keys(newParams).forEach((key) => {
			// 	console.log(key);
			// 	if (!['content', 'tooltipClass', 'arrowClass', 'open', 'disabled'].includes(key))
			// 		throw new Error(
			// 			'Updates to Tooltip settings only support parameters content (strings), tooltipClass, ArrowClass, open (state), and disabled.',
			// 		);
			// });
			// Prevent changes to Svelte component content reference.
			// elemTooltip.className = ('tooltip ' + params.tooltipClass).trim();
			if (newParams.content && typeof newParams.content !== 'string')
				throw new Error('You cannot change Svelte Component/Tooltip Content after initially set.');
			// close(() => {
			if (
				newParams.content !== params.content &&
				typeof newParams.content === 'string' &&
				!explicitTooltip
			) {
				elemTooltip.innerHTML = newParams.content;
			}
			params = { ...params, ...newParams };
			renderTooltip();
			// if localTooltipState out of sync with params.open,
			// changes have been made from outside so perform
			if (params.open !== localState.open) {
				params.open ? setTimeout(() => open(false), delayin) : delayedClose();
			}
			// });
		},
		destroy: () => {
			triggerNode.removeEventListener('click', toggle, true);
			triggerNode.removeEventListener('mouseover', throttledHover, true);
			triggerNode.removeEventListener('mouseleave', delayedClose, true);
			triggerNode.removeEventListener('focus', toggle, true);
			triggerNode.removeEventListener('focus', delayedOpen, true);
			triggerNode.removeEventListener('blur', delayedClose, true);
			triggerNode.removeEventListener('contextmenu', rclick, true);
			triggerNode.removeEventListener('mousedown', longpress, true);
			triggerNode.removeEventListener('mouseup', cancelLongpress, true);
			triggerNode.removeEventListener('dblclick', toggle, true);
			// Window Events
			window.removeEventListener('click', onWindowClick, true);
			window.removeEventListener('keydown', onWindowKeyDown, true);
		}
	};

	function isSvelteComponent(content: string | (() => void)): boolean {
		// TODO: looking or better way
		// failed with content instanceof SvelteComponent
		return typeof content === 'function';
	}

	function fireCustomEvent(element: HTMLElement, eventName: string, props: object = {}) {
		element.dispatchEvent(
			new CustomEvent(eventName, {
				detail: { ...props }
			})
		);
	}
};
