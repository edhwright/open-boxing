<script lang="ts">
	import { tints } from "../../../components/orgTags";
	import type { Option } from "./interactives";

	// Search to add a boxer (or a world title); each one added shows as a chip that can be removed. The suggestions
	// are a listbox: arrow keys move through them, Enter adds, Escape closes.
	interface Props {
		label: string;
		placeholder: string;
		options: Option[];
		chosen: string[];
		onadd: (key: string) => void;
		onremove: (key: string) => void;
	}

	let { label, placeholder, options, chosen, onadd, onremove }: Props = $props();

	let query = $state("");
	let active = $state(0);
	const id = $props.id();

	const suggestions = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (q.length < 2) return [];
		return options.filter((o) => !chosen.includes(o.key) && o.label.toLowerCase().includes(q)).slice(0, 8);
	});
	const byKey = $derived(new Map(options.map((o) => [o.key, o])));

	function add(key: string) {
		onadd(key);
		query = "";
		active = 0;
	}
	function keydown(e: KeyboardEvent) {
		if (!suggestions.length) return;
		if (e.key === "ArrowDown") active = (active + 1) % suggestions.length;
		else if (e.key === "ArrowUp") active = (active - 1 + suggestions.length) % suggestions.length;
		else if (e.key === "Enter") add(suggestions[active].key);
		else if (e.key === "Escape") query = "";
		else return;
		e.preventDefault();
	}
</script>

<section aria-label={label} class="border-t-2 border-ink pt-4 pb-5">
	<div class="relative max-w-140">
		<label for="{id}-input" class="mb-1.5 block text-[13px] font-medium text-ink-soft">{label}</label>
		<input
			id="{id}-input"
			type="text"
			role="combobox"
			autocomplete="off"
			aria-expanded={suggestions.length > 0}
			aria-controls="{id}-list"
			aria-activedescendant={suggestions.length ? `${id}-${active}` : undefined}
			{placeholder}
			bind:value={query}
			oninput={() => (active = 0)}
			onkeydown={keydown}
			class="h-11 w-full border border-ink bg-cream px-3 text-base placeholder:text-muted"
		/>
		{#if suggestions.length}
			<ul id="{id}-list" role="listbox" class="absolute inset-x-0 top-full z-10 mt-1 border border-ink bg-cream py-1 shadow-[0_4px_12px_rgb(26_26_23/0.12)]">
				{#each suggestions as s, i}
					<li id="{id}-{i}" role="option" aria-selected={i === active}>
						<button
							type="button"
							tabindex="-1"
							onclick={() => add(s.key)}
							onmouseenter={() => (active = i)}
							class={["flex min-h-11 w-full cursor-pointer items-center px-3 text-left text-[15px]", i === active && "bg-wba-tint/60"]}
						>
							<span class={s.org ? `org ${tints[s.org]}` : "font-semibold"}>{s.label}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	{#if chosen.length}
		<ul class="mt-4 flex flex-wrap gap-2">
			{#each chosen as key}
				{@const option = byKey.get(key)}
				{#if option}
					<li class="flex items-center gap-0.5 border border-ink bg-cream pl-2.5">
						{#if option.swatch}<span aria-hidden="true" class="mr-1.5 size-3 shrink-0 rounded-full border-[1.5px] border-ink" style="background: {option.swatch}"></span>{/if}
						<span class="pr-1 text-sm"><span class={option.org ? `org ${tints[option.org]}` : "font-semibold"}>{option.label}</span></span>
						<button type="button" aria-label="Remove {option.label}" onclick={() => onremove(key)} class="flex size-9 cursor-pointer items-center justify-center hover:bg-ink/6">
							<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	{/if}
</section>
