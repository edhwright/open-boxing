<script lang="ts">
	export let showSearch: boolean;
</script>

<button class="button" aria-label="Search" on:click={() => (showSearch = !showSearch)}>
	{#if !showSearch}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-search"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<circle cx="10" cy="10" r="7" />
			<line x1="21" y1="21" x2="15" y2="15" />
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-x"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	{/if}
</button>

<style>
	.button {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 56px;
		width: 56px;
		border: 0;
		padding: 0;
		background-color: var(--theme-bg);
	}

	.button:hover {
		background-color: var(--theme-border);
		cursor: pointer;
	}

	svg {
		stroke: var(--theme-text);
	}
</style>
