<script lang="ts">
	import type { TooltipSettings } from '$lib/tooltip/types.js';
	import { CodeBlock, SlideToggle } from '@skeletonlabs/skeleton';
	import Component from './Component.svelte';
	import { fly, fade } from 'svelte/transition';
	// above for demo only, not needed for tooltip
	// import Transition from './Tooltip.svelte';
	import { tooltip } from '$lib/tooltip/tooltip';

	let content = 'Tooltip Text';
	let open = true;
	let disabled = false;
	// add or remove from dom to transition happens
	// $: document
	// 	.querySelector("`[data-popup='tt-4567']")
	// 	?.setAttribute('display', open ? 'block' : 'none');

	function toggleTriggerDisabled() {
		let button = document.querySelector('#button-ex12') as HTMLButtonElement;
		if (button.disabled) button.removeAttribute('disabled');
		else button.disabled = true;
	}
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center m-4">
	<h1 class="text-xl">Skeleton Tooltips Action - WIP</h1>
	<div class="flex flex-start">
		<ul class="p-5">
			<li class="p-1">🟢 Written for SkeletonUI V2</li>
			<li class="p-1">
				🟢 Works as a replacement for SkeletonUI popup. Therefore need to implement in +layout lke
				before (<a
					href="https://www.skeleton.dev/utilities/popups#installation"
					class="anchor"
					target="_blank">See Docs</a
				>).
			</li>
			<li class="p-1">
				🟢 Main benefit, not having to explicity add DOM element with data prop data-popup='???' (in
				most cases). Also, automatically creates arrow when appropriate and copies background,
				z-index, border, and ring (box-shadow) attributes from tooltip to arrow
			</li>
			<li>
				<details>
					<summary>Current Popup Problems</summary>
					The Current popup arrow is difficult to style. If you wish a border or ring (box-shadow). It
					creates a box, rotates it, but all 4 edges are shown (including 2 inapproprite ones inside
					tooltip). You cannot leave it to user to hide these because they vary as float-ui is smart
					and despite requested side for displaying the popup, it will flip to other side, and shift
					in order to display it without cropping. The user cannot easily handle this. My implementation
					does.
				</details>
			</li>
			<li class="p-1">
				🟢 Tooltips added simply attaching "use:tooltip" to the target, then content is identified
				in the same trigger element in 1 of 3 ways:
				<ul class="pl-6 pt-2">
					<li>⋅ <a class="anchor" href="#ex1">title attribute</a> - fixed onMount</li>
					<li>⋅ <a class="anchor" href="#ex2">aria-label attribute</a> - fixed onMount</li>
					<li>
						⋅ <a class="anchor" href="#ex3">Svelte action param "content"</a> - can be dynamically updated
					</li>
				</ul>
			</li>
			<li class="p-1">
				🟢 Tooltip content can be:
				<ul class="pl-6 pt-2">
					<li>⋅ <a class="anchor" href="#ex1">Plain text</a></li>
					<li>⋅ <a class="anchor" href="#ex4">HTML</a></li>
					<li>
						⋅ <a class="anchor" href="#ex5">A reference to DOM element with data-popup="?"</a>
					</li>
					<li>⋅ <a class="anchor" href="#ex6">A Svelte Component!</a></li>
				</ul>
			</li>
			<li>
				🟢 Popup Requests - also see <a
					href="https://github.com/skeletonlabs/skeleton/issues/1916"
					class="anchor"
					target="_blank">Popup Refactor</a
				>
				<div class="ml-6">
					<ul>
						<li>
							✅ Tooltip Arrow inherits z-index, background from Tooltip and appropriately displays
							ring/border.
						</li>
						<li>✅ Identify content via title attribute.</li>
						<li>✅ Identify content via aria-label attribute.</li>
						<li>✅ Continue to support passing reference to DOM element as content</li>
						<li>✅ Pass a Svelte Component as content with support for component state</li>
						<li>✅ Pass HTML string as content</li>
						<li>✅ Allow popups to be triggered programmatically.</li>
						<li>✅ Right click option to trigger tooltip.</li>
						<li>
							✅ Longpress option to trigger tooltip. Duration is configurable is params via
							longPressDuration
						</li>
						<li>✅ Dblclick option to trigger tooltip.</li>
						<li>✅ Fix transition not showing on first trigger.</li>
						<li>
							✅ Better status updates to the outside for when the popup is opened, closed or
							toggled.
						</li>
						<li>
							✅ Throttled hover trigger. quick mouseovers (on the way to other intentions) don't
							trigger hover trigger below delayin threshold.
						</li>
						<li>✅ Control of built in delayin, delayout, duration for default fade transition</li>
						<li>✅ The ability to reuse the same popup with multiple triggers</li>
						<li>
							✅ Ability to disable/turn off popup(s) through the use of a prop or have popup check
							the disabled state on the trigger element when open event occurs.
						</li>
						<li>❔ Provide much richer and more prominent type safety</li>
						<li>
							❌ The ability to set or customize the enter/exit animations for the popup itself
						</li>
					</ul>
				</div>
			</li>
		</ul>
	</div>
	<div class="flex gap-2">
		<div class="block gap-5">
			<!--			<div id="ex1" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #1: Implementation Simple and Clean using "title" attribute<button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ open: open }}
						title="Tooltip Text">Hover me! Example #1</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip title='Tooltip Text'>Hover me! Example #1</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex2" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #2 Implementation also Simple using "aria-label" attribute <button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip
						aria-label="Tooltip Text">Hover me! Example #2</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip aria-label='Tooltip Text'>Hover me! Example #2</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex3" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #3: Implementation Dynamic svelte action params <button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ content: content }}>Hover me! Example #3</button
					>
					<button
						class="btn btn-sm variant-ghost-surface rounded-xl"
						on:click={() => {
							content = 'Tooltip #3 Updated dynamically! ' + new Date().toLocaleTimeString();
						}}>Click to Update Tooltip Example #3</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<scr` +
						`ipt>
  let content='Tooltip Text';
</script>

<button use:tooltip={{content: content}}>Hover me! Example #3</button>
<button on:click={()=> { content="Tooltip #3 Updated dynamically! " + (new Date()).toLocaleTimeString() }}>
	Click to Update Tooltip Example #3
</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex4" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #4: Using HTML as content:
					<button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip
						title="<span style='color:red;'>Skeleton Tooltip created using HTML</span>"
						>Hover me!</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip title="<span style='color:red;'>Skeleton Tooltip created using HTML</span>">Hover me!</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex5" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #5: Using hardcoded HTML as content:
					<button class="btn btn-sm variant-ghost-surface" use:tooltip={{ content: 'uniqueID1234' }}
						>Hover me!</button
					>
					<div data-popup="uniqueID1234">I'm hardcoded content!</div>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip={{ content: "uniqueID1234" }}>Hover me!</button>
<div data-popup="uniqueID1234">I'm hardcoded content!</div>`}
				/>
				Also you could use a Svelte Component as content instead of div, just add the data-popup="uniqueID1234"
				to the element in the Component wrapping the content. ❌ PROBLEM: rendering loop
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex6" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #6: Using a Svelte Component as content with Component State: <button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ content: Component, componentState: { a: 'Hi!' } }}>Hover me!</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<scr` +
						`ipt>
  import Component from './Component.svelte';
</script>
	
<button use:tooltip={{content:Component, componentState:{a:'Hi!'}} }>Hover me!</button>`}
				/>
				<div class="my-2">and...</div>
				<CodeBlock
					language="html"
					code={`// Component.svelte
<scr` +
						`ipt>
  export let a;
</script>

<div>This is from Component.svelte!</div>
<div>This received componentState.a prop and a = "{a}"</div>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex7" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #7: Exposing tooltip state (open console log to see state changes)<button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ content: 'Tooltip' }}
						on:toggle={(e) => console.log(`tooltip toggled, state is ${e.detail.state}`)}
						on:open={() => console.log('tooltip opened')}
						on:close={() => console.log('tooltip closed')}>Hover me!</button
					>
					<!~~ TODO: Tooling Error, occurs when more than 2 custom events listened on ~~>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip={{content:'Tooltip'}} 
	on:toggle={() => console.log('tooltip toggled')}
	on:open={()=>console.log("tooltip opened")}
	on:close={()=>console.log("tooltip closed")
>Hover me!</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex8" class="py-4 flex flex-col gap-2">
				<div class="flex items-center gap-2">
					✅ Example #8: Programmatic Tooltip Control <button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ content: 'Tooltip', event: 'click', open: open }}>Click Me!</button
					>
					<SlideToggle name="slider-small" bind:checked={open} active="bg-primary-500" size="sm"
						>Tooltip</SlideToggle
					>open={open}
				</div>
				<CodeBlock
					language="html"
					code={`<scr` +
						`ipt>
  let open = false;
</script>

<button use:tooltip={{ content: 'Tooltip', open: open }}>Hover Me</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex9" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #9: Trigger by contextmenu (right-click) <button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{
							content: 'tt-context123',
							event: 'contextmenu',
							includeArrow: false,
							tooltipClass: ''
						}}>Right Click Me!</button
					>
					<!~~ Wrapper needed b/c popup uses block, and we need flex for btn-group-vertical ~~>
					<div data-popup="tt-context123">
						<div class="btn-group-vertical variant-filled">
							<button>Delete</button>
							<button>Update</button>
							<button>Cancel</button>
						</div>
					</div>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip={{ 
	content: 'tt-context123',
	event: 'contextmenu',
	includeArrow: false,
	tooltipClass: '' /* turn off default tooltip formatting */
}}>Right Click Me!</button>

<!~~ Wrapper needed b/c popup uses block, and we need flex for btn-group-vertical ~~>
<div data-popup="tt-context123">
	<div class="btn-group-vertical variant-filled">
		<button>Delete</button>
		<button>Update</button>
		<button>Cancel</button>
	</div>
</div>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex10" class="py-4 flex flex-col gap-2">
				✅ Example #10: Defined tooltip content once, use it multiple for more than 1 trigger
				<button class="btn btn-sm variant-ghost-surface" use:tooltip={{ content: '6789' }}
					>Hover Me!</button
				>
				<div data-popup="6789">I'm the content only declared once</div>
				<button class="btn btn-sm variant-ghost-surface" use:tooltip={{ content: '6789' }}
					>Hover Me Too!</button
				>
				<CodeBlock
					language="html"
					code={`<button class="btn btn-sm variant-ghost-surface" use:tooltip={{ content: '6789' }}>Hover Me!</button>

<div data-popup="tt-6789">I'm the content only declared once</div>

<button class="btn btn-sm variant-ghost-surface" use:tooltip={{ content: 'tt-6789' }}>Hover Me Too!</button>`}
				/>
			</div>

			<hr class="!border-t-4 my-2" />
			<div id="ex11" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #11: Longpress Trigger<button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ event: 'longpress' }}
						title="You triggered me by Longpress">Lonpress me!</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip title='Tooltip Text'>Hover me! Example #1</button>`}
				/>
				❓ QUESTION: should close be longpress, or just click, or configurable?
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex12" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #12: Doubleclick Trigger<button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ event: 'dblclick' }}
						title="You trigger me by DoubleClick">DoubleClick Me!</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip={{ event: 'dblclick' }} title='Tooltip Text'>DoubleClick Me!</button>`}
				/>
				❓ QUESTION: should close be doubleclick, or just click, or configurable?
			</div>
			<hr class="!border-t-4 my-2" />-->
			<div id="ex11" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #11: Disable tooltip via via dsiabled prop<button
						class="btn btn-sm variant-ghost-surface"
						use:tooltip={{ disabled: disabled }}
						title="Tooltip Text">Hover me! Example #11</button
					>
					<label><input type="checkbox" class="checkbox" bind:checked={disabled} /> Disabled</label>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip title='Tooltip Text'>Hover me! Example #1</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex12" class="py-4 flex flex-col gap-2">
				<div>
					✅ Example #12: Disable tooltip via via disabling tooltip trigger<button
						id="button-ex12"
						class="btn btn-sm variant-ghost-surface"
						disabled
						use:tooltip
						title="Tooltip Text">Hover me! Example #12</button
					>
					<button class="btn btn-sm variant-ghost-surface" on:click={toggleTriggerDisabled}
						>Toggle Disabled</button
					>
				</div>
				<CodeBlock
					language="html"
					code={`<button use:tooltip title='Tooltip Text'>Hover me! Example #1</button>`}
				/>
			</div>
			<hr class="!border-t-4 my-2" />
			<div id="ex13" class="py-4 flex flex-col gap-2">
				❌ Example #13: Custom Transitions - ugly implementation w/all the requirements.
				<ul>
					<li>
						• Setting of transition.default = false sets delayin, delayout, duration of default
						tooltip opacity transition to 0, setting it up for outside control.
					</li>
					<li>• First get this working with hardcoded Svelte transition.</li>
					<li>
						• Then, change dynamic transitions in line with current Skeletonui TransittionIn
						TransitionOut respecting $prefersReducedMotionStore.
					</li>
					<li>• Finally, clean up implementation with slots and shifting attributes.</li>
				</ul>
				<button
					class="btn btn-sm variant-ghost-surface"
					on:toggle={(e) => (open = e.detail.state)}
					use:tooltip={{
						event: 'click',
						content: 'tt666',
						transition: { default: false }
					}}>Click Me!</button
				>
				<!-- Csnnot use {#if open} because not in DOM to identify as explicit content. -->
				{#key open}
					<!-- Use wrapper of content here and apply transitions to it, setup for future slot -->
					<div data-popup="tt666" transition:fly={{ duration: 2000, x: 200, y: -500, opacity: 1 }}>
						<div>I'm the content with custom transition</div>
						<div id="arrow-tt666" />
					</div>
				{/key}
				<div>
					open={open}
				</div>
				Hoping for something like
				<CodeBlock
					language="html"
					code={`<button
	on:open={() => opentt = true}
	on:close={() => opentt = false}
	use:tooltip={{ event: 'click', content: 'tt666', transition: { default: false } }}>Click Me!</button>
<Transition 
	dataPopup="tt666"
	TransitionIn={fly}
	TransitionInParams={{duration:1000, y:500}}
>
	<div>I'm the content with custom transition</div>
</Transition>`}
				/>
				❌ PROBLEM: simply not working yet?
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		scroll-behavior: smooth;
	}
</style>
