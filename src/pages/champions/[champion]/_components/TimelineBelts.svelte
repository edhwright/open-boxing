<script lang="ts">
	import dayjs from "dayjs";
	import isBetween from "dayjs/plugin/isBetween";
	dayjs.extend(isBetween);
	import { orgs, orgColours } from "../../../../utils";
	import type { Reign } from "../../../../types";
	import type { TimelineDate } from "../../../../utils";
	export let reigns: Reign[];
	export let timelineDate: TimelineDate;

	const orgsHeld = orgs.filter((org) => reigns.map((reign) => reign.title.org.name.abbreviation).includes(org));

	const reignsAtTimelineDate = reigns.filter((reign) => {
		return dayjs(timelineDate.date).isBetween(reign.period.begins, reign.period.current ? new Date() : reign.period.ends, null, "[]");
	});

	const orgReignsAtTimelineDate: (Reign[] | null)[] = [];
	orgsHeld.forEach((org) => {
		if (reignsAtTimelineDate.map((reign) => reign.title.org.name.abbreviation).includes(org)) {
			orgReignsAtTimelineDate.push(reignsAtTimelineDate.filter((reign) => reign.title.org.name.abbreviation === org));
		} else {
			orgReignsAtTimelineDate.push(null);
		}
	});

	// two stripes, for a belt held twice at once or a reign beginning as another continues
	const striped = "bg-[linear-gradient(to_right,rgb(255_255_255/0.15)_0%,transparent_50%,rgb(255_255_255/0.15)_50%,transparent_100%)]";
	const belt = (orgReign: Reign[]) => `ml-0.5 w-5 ${orgColours[orgReign[0].title.org.name.abbreviation].bg}`;
</script>

{#each orgReignsAtTimelineDate as orgReign}
	{#if orgReign}
		{#if orgReign.map((reign) => reign.period.begins).includes(timelineDate.date)}
			{#if orgReign.every((reign) => reign.period.begins === timelineDate.date)}
				<li class="{belt(orgReign)} rounded-t {orgReign.length > 1 ? striped : ''}" />
			{:else}
				<li class="{belt(orgReign)} {striped}" />
			{/if}
		{:else if orgReign.map((reign) => reign.period.ends).includes(timelineDate.date)}
			{#if orgReign.every((reign) => reign.period.ends === timelineDate.date)}
				<li class="{belt(orgReign)} h-1 rounded-b {orgReign.length > 1 ? striped : ''}" />
			{:else}
				<li class="{belt(orgReign)} {striped}" />
			{/if}
		{:else}
			<li class="{belt(orgReign)} {orgReign.length > 1 ? striped : ''}" />
		{/if}
	{:else}
		<li class="ml-0.5 w-5" />
	{/if}
{/each}
