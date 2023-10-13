<script lang="ts">
	import { fade } from 'svelte/transition';
	import { tooltip } from '$lib/tooltip/tooltip';
	import type { Transition, TransitionParams } from './index';
	import type { TooltipSettings } from '$lib/tooltip/types';
	import { dynamicTransition } from '$lib/tooltip/transitions';
	import { writable } from 'svelte/store';

	let prefersReducedMotionStore = writable(false); // TODO: hook back up to real store

	/* WIP */

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	type TransitionIn = Transition;
	type TransitionOut = Transition;
	export let transitions = !$prefersReducedMotionStore;
	export let transitionIn: TransitionIn = fade as TransitionIn;
	export let transitionInParams: TransitionParams<TransitionIn> = { duration: 200 };
	export let transitionOut: TransitionOut = fade as TransitionOut;
	export let transitionOutParams: TransitionParams<TransitionOut> = { duration: 200 };
	export let open = false;
	export let id: string;

	console.log($$slots);

	// remove data--popup from content element, so we can set it controlled wrapper
	// let content = document.querySelector(`[data-popup='${id.replace(/[`"']/g, '')}']`);
	// content?.removeAttribute('data-popup');
</script>

<slot name="trigger" />
{#key open}
	<div
		data-popup={id}
		on:open={() => (open = true)}
		on:close={() => (open = false)}
		in:dynamicTransition|local={{
			transition: transitionIn,
			params: transitionInParams,
			enabled: transitions
		}}
		out:dynamicTransition|local={{
			transition: transitionOut,
			params: transitionOutParams,
			enabled: transitions
		}}
	>
		<slot />
	</div>
{/key}
