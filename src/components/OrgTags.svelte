<script lang="ts">
	import { orgSegments } from "./orgTags";

	// World title names as highlighted text (see orgTags.ts)
	interface Props {
		orgs: { abbreviation: string; short: string }[];
		// abbreviations of the titles to highlight in gold together
		gold?: string[];
	}

	let { orgs, gold = [] }: Props = $props();
</script>

{#each orgSegments(orgs, gold) as segment}<span class="org whitespace-nowrap {segment.tint}">{segment.text}</span>{segment.separator}{/each}
