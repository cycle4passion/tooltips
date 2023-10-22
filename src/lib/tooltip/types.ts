import type { Writable } from 'svelte/store';
export declare const storePopup: Writable<any>;

export declare function tooltip2(
	triggerNode: HTMLElement,
	params: TooltipSettings
): {
	update(newParams: TooltipSettings): void;
	destroy(): void;
};

export interface ComputePositionReturn {
	x: number;
	y: number;
	placement: Placement;
	strategy: 'absolute' | 'fixed';
	middlewareData: any;
}

export type TooltipState = {
	open?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	autoUpdateCleanup: () => void;
};

/** Placement https://floating-ui.com/docs/computePosition#placement */
type Direction = 'top' | 'bottom' | 'left' | 'right';

type Placement = Direction | `${Direction}-start` | `${Direction}-end`;
export interface Middleware {
	/** Offset middleware settings: https://floating-ui.com/docs/offset */
	offset?: number | Record<string, any>;
	/** Shift middleware settings: https://floating-ui.com/docs/shift */
	shift?: Record<string, any>;
	/** Flip middleware settings: https://floating-ui.com/docs/flip */
	flip?: Record<string, any>;
	/** Arrow middleware settings: https://floating-ui.com/docs/arrow */
	arrow?: {
		element: string;
	} & Record<string, any>;
	/** Size middleware settings: https://floating-ui.com/docs/size */
	size?: Record<string, any>;
	/** Auto Placement middleware settings: https://floating-ui.com/docs/autoPlacement */
	autoPlacement?: Record<string, any>;
	/** Hide middleware settings: https://floating-ui.com/docs/hide */
	hide?: Record<string, any>;
	/** Inline middleware settings: https://floating-ui.com/docs/inline */
	inline?: Record<string, any>;
}

export type TooltipSettings = {
	/** Set the Content. */
	content?: any; // TODO: would like string | SvelteComponent but his does not work
	/** Control if arrow included in tooltip */
	includeArrow?: boolean;
	/** Set the tooltip classes. */
	tooltipClass?: string;
	/** Set the arrow classes. */
	arrowClass?: string;
	/** Provide component state for content as Svelte Component */
	componentState?: object;
	/** Set tooltip open/close state */
	open?: boolean;
	/** Allow for disabling */
	disabled?: boolean;
	/** Provide the event type. */
	event?:
		| 'click'
		| 'hover'
		| 'focus-blur'
		| 'focus-click'
		| 'contextmenu'
		| 'longpress'
		| 'dblclick';
	/** Set the placement position. Defaults 'bottom'. */
	placement?: Placement;
	/** Query elements which will close the popup when clicked. Defaults `'a[href], button'`. */
	closeQuery?: string;
	/** Optional callback function that reports state change. */
	state?: (event: { state: boolean }) => void;
	/** Provide Floating UI middleware settings. */
	middleware?: Middleware;
	/** Provide the duration in milliseconds for longpress events to trigger. */
	longPressDuration?: number;
	/** Provide customizable timing related settings for fade in/out. */
	transition?: {
		default?: boolean;
		duration?: number;
		function?: string;
		delayin?: number;
		delayout?: number;
	};
};

export {};
