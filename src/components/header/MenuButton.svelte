<script lang="ts">
	export let showMobileNav: boolean;
</script>

{#if !showMobileNav}
	<button class="flex md:hidden justify-center items-center h-14 w-14 hover:bg-neutral-800 transition-colors" aria-label="Open menu" on:click={() => (showMobileNav = !showMobileNav)}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="text-neutral-100"
			><path d="M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z"></path></svg
		>
	</button>
{:else}
	<button class="flex md:hidden justify-center items-center h-14 w-14 hover:bg-neutral-800 transition-colors" aria-label="Close menu" on:click={() => (showMobileNav = !showMobileNav)}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="text-neutral-100"
			><path
				d="M10.5859 12L2.79297 4.20706L4.20718 2.79285L12.0001 10.5857L19.793 2.79285L21.2072 4.20706L13.4143 12L21.2072 19.7928L19.793 21.2071L12.0001 13.4142L4.20718 21.2071L2.79297 19.7928L10.5859 12Z"
			></path></svg
		>
	</button>
{/if}
