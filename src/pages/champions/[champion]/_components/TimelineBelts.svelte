<script lang="ts">
	import dayjs from "dayjs";
	import isBetween from "dayjs/plugin/isBetween";
	dayjs.extend(isBetween);
	import { orgs } from "../../../../utils";
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
</script>

{#each orgReignsAtTimelineDate as orgReign}
	{#if orgReign}
		{#if orgReign.map((reign) => reign.period.begins).includes(timelineDate.date)}
			{#if orgReign.every((reign) => reign.period.begins === timelineDate.date)}
				<li class="belt__active belt--begins {orgReign.length > 1 ? 'belt--double' : ''}" style="background-color: var(--{orgReign[0].title.org.name.abbreviation.toLowerCase()}-bg)" />
			{:else}
				<li class="belt__active belt--beginsAndContinues" style="background-color: var(--{orgReign[0].title.org.name.abbreviation.toLowerCase()}-bg)" />
			{/if}
		{:else if orgReign.map((reign) => reign.period.ends).includes(timelineDate.date)}
			{#if orgReign.every((reign) => reign.period.ends === timelineDate.date)}
				<li class="belt__active belt--ends {orgReign.length > 1 ? 'belt--double' : ''}" style="background-color: var(--{orgReign[0].title.org.name.abbreviation.toLowerCase()}-bg)" />
			{:else}
				<li class="belt__active belt--endsAndContinues" style="background-color: var(--{orgReign[0].title.org.name.abbreviation.toLowerCase()}-bg)" />
			{/if}
		{:else}
			<li class="belt__active {orgReign.length > 1 ? 'belt--double' : ''}" style="background-color: var(--{orgReign[0].title.org.name.abbreviation.toLowerCase()}-bg)" />
		{/if}
	{:else}
		<li class="belt__inactive" />
	{/if}
{/each}

<style>
	li {
		width: 20px;
		margin-left: 2px;
	}

	.belt--begins {
		border-radius: 4px 4px 0 0;
	}

	.belt--beginsAndContinues {
		background-image: linear-gradient(to right, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0) 100%);
	}

	.belt--ends {
		height: 4px;
		border-radius: 0 0 4px 4px;
	}

	.belt--double {
		background-image: linear-gradient(to right, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0) 100%);
	}
</style>
