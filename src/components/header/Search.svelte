<script lang="ts">
	import { onMount } from "svelte";

	interface SearchRecord {
		name: string;
		slug: string;
	}

	let searchIndex: SearchRecord[];
	let filteredSearchIndex: SearchRecord[];
	let search: string = "";
	let searchInput: HTMLElement;

	function handleInput() {
		if (searchIndex) {
			filteredSearchIndex = searchIndex.filter((c) => {
				return Object.values(c).toString().toLowerCase().includes(search.toLowerCase());
			});
		}
	}

	onMount(async () => {
		searchInput.focus();
		const res = await fetch(`/api/search.json`);
		const data = await res.json();
		searchIndex = data;
		filteredSearchIndex = searchIndex;
	});
</script>

<svelte:window on:click={() => (search = "")} />

<div class="search" on:click|stopPropagation>
	<input class="search__input" type="text" bind:value={search} bind:this={searchInput} on:input={handleInput} />
	{#if filteredSearchIndex && search.length > 1}
		<nav class="search__nav">
			<ul class="search__list">
				{#each filteredSearchIndex.slice(0, 20) as i}
					<li class="search__item">
						<a class="search__link" tabindex="0" href="/{i.slug}">{i.name}</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</div>

<style>
	.search {
		flex-grow: 1;
	}

	.search__input {
		width: 100%;
		height: 56px;
		z-index: 1;
		padding: 0 0 0 16px;
		border: 0;
		outline: none;
		background-color: var(--theme-content-bg);
		border-bottom: 1px solid var(--theme-content-bg);
		box-sizing: border-box;
	}

	.search__input:focus {
		border-bottom: 2px solid var(--theme-gold);
	}

	.search__nav {
		width: 100%;
		margin: 0;
		position: absolute;
		padding: 0;
		z-index: 9999;
	}

	.search__list {
		padding: 0;
		list-style: none;
	}

	.search__item {
		border-bottom: 1px solid var(--theme-border);
		background-color: var(--theme-content-bg);
	}

	.search__item:last-child {
		border-radius: 0 0 4px 4px;
	}

	.search__item:hover {
		background-color: var(--theme-border);
		text-decoration: underline;
	}

	.search__item:last-child {
		border-bottom: none;
	}

	.search__link {
		padding: 4px 0 4px 16px;
		line-height: 28px;
		/* font-size: 14px; */
		/* background-color: white; */
		width: 100%;
		display: block;
		font-size: var(--font-size-medium);
		color: var(--theme-text);
		text-decoration: none;
		/* font-weight: 600; */
	}

	@media (min-width: 768px) {
		.search__nav {
			max-width: calc(100% - 56px);
		}
	}

	@media (min-width: 1280px) {
		.search__nav {
			max-width: calc(1280px - 56px);
		}
	}
</style>
