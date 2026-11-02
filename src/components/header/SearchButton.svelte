<script lang="ts">
	export let showSearch: boolean;
</script>

{#if !showSearch}
	<button
		class="flex justify-center items-center h-14 w-14 hover:bg-neutral-800 transition-colors outline-hidden focus:outline-hidden"
		aria-label="Search"
		on:click={() => (showSearch = true)}
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="text-neutral-100"
			><path
				d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"
			></path></svg
		>
	</button>
{:else}
	<button
		class="flex justify-center items-center h-14 w-14 bg-neutral-800 transition-colors outline-hidden focus:outline-hidden"
		aria-label="Close"
		on:click={() => (showSearch = false)}
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="text-neutral-100"
			><path
				d="M10.5859 12L2.79297 4.20706L4.20718 2.79285L12.0001 10.5857L19.793 2.79285L21.2072 4.20706L13.4143 12L21.2072 19.7928L19.793 21.2071L12.0001 13.4142L4.20718 21.2071L2.79297 19.7928L10.5859 12Z"
			></path></svg
		>
	</button>
{/if}
