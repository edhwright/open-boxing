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

<div class="grow" role="button" tabindex="0" on:click|stopPropagation on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}>
	<input class="w-full h-14 z-10 pl-4 bg-neutral-800 text-neutral-100 outline-hidden" type="text" bind:value={search} bind:this={searchInput} on:input={handleInput} />
	{#if filteredSearchIndex && search.length > 1}
		<nav class="w-full absolute z-50 md:max-w-[calc(100%-56px)] xl:max-w-[calc(1280px-56px)]">
			<ul>
				{#each filteredSearchIndex.slice(0, 20) as i}
					<li class="border-b border-neutral-700 bg-neutral-800 text-sm last:border-0 last:rounded-b hover:bg-neutral-700 hover:underline">
						<a class="py-1 pl-4 leading-7 w-full block" tabindex="0" href="/{i.slug}/">{i.name}</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</div>
