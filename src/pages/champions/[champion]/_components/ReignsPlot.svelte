<script lang="ts">
	import { isChampion, boutNameFromBout, orgColours } from "../../../../utils";
	import { scaleTime } from "d3-scale";
	import dayjs from "dayjs";
	import type { ReignsPlotData } from "../../../../utils";
	import type { Bout } from "../../../../types";
	export let reignsPlotData: ReignsPlotData;

	const plotHeight = reignsPlotData.titleData.length * 40;

	const ticks =
		reignsPlotData.ticks.length < 10
			? reignsPlotData.ticks
			: reignsPlotData.ticks.length < 20
			? reignsPlotData.ticks.filter((tick) => new Date(tick.date).getFullYear() % 2 === 0)
			: reignsPlotData.ticks.filter((tick) => new Date(tick.date).getFullYear() % 3 === 0);

	const weightClassYLabelPositions: { class: string; index: number }[] = [];
	reignsPlotData.titleData.forEach((titleData, i) => {
		if (!weightClassYLabelPositions.map((weightClass) => weightClass.class).includes(titleData.title.weight.class)) {
			weightClassYLabelPositions.push({ class: titleData.title.weight.class, index: i });
		}
	});

	const timeScale = scaleTime()
		.domain([new Date(reignsPlotData.startDate), new Date(reignsPlotData.endDate)])
		.range([0, 100]);

	function boutResultClass(bout: Bout) {
		if (bout.status === "SCHEDULED") {
			return "bg-neutral-800";
		} else if (bout.result.winner === "DRAW") {
			return "bg-draw";
		} else if (bout.result.winner === "NO CONTEST") {
			return "bg-draw";
		} else if (bout.result.winner === "BOXER A" && isChampion(bout.boxers.boxerA) && bout.boxers.boxerA.championId === reignsPlotData.champion.championId) {
			return "bg-won";
		} else if (bout.result.winner === "BOXER B" && isChampion(bout.boxers.boxerB) && bout.boxers.boxerB.championId === reignsPlotData.champion.championId) {
			return "bg-won";
		} else {
			return "bg-lost";
		}
	}
</script>

<!-- each title gets a 40px row; the left 10rem margin holds the weight class and org labels -->
<div class="relative mb-12 ml-40 w-[calc(100%-10rem)] border-t border-neutral-700 bg-neutral-800" style="height: {plotHeight}px">
	<div>
		{#each reignsPlotData.titleData as titleData, i}
			<div class="absolute inset-x-0 h-10 border-b border-neutral-700" style="top: {i * 40}px" />
			<div class="absolute -left-15 translate-y-2.5 text-xs/5 font-medium text-neutral-400" style="top: {i * 40}px">{titleData.title.org.name.abbreviation}</div>
		{/each}
	</div>
	<div>
		{#each weightClassYLabelPositions as weightClassLabel}
			<div class="absolute -left-40 w-[calc(100%+10rem)] border-t border-neutral-400" style="top: {weightClassLabel.index * 40}px" />
			<div class="absolute -left-40 w-25 translate-y-1.5 text-xs font-medium" style="top: {weightClassLabel.index * 40}px">{weightClassLabel.class}</div>
		{/each}
	</div>
	<div>
		{#each reignsPlotData.titleData as titleData, i}
			{#if titleData.reigns}
				{#each titleData.reigns as reign}
					<div
						class="absolute h-5 {orgColours[reign.title.org.name.abbreviation].bg}"
						style="left: {timeScale(new Date(reign.period.begins))}%;
                        width: calc({timeScale(reign.period.current || !reign.period.ends ? new Date(dayjs().format('YYYY-MM-DD')) : new Date(reign.period.ends))}% - {timeScale(
							new Date(reign.period.begins)
						)}%);
                        top: {i * 40 + 10}px"
					/>
				{/each}
			{/if}
			{#if titleData.bouts}
				{#each titleData.bouts as bout}
					<div
						class="group absolute z-10 size-5 -translate-x-2.5 translate-y-2.5 rounded-full shadow-[0_1px_4px_rgb(0_0_0/16%),inset_0_0_0_2px_white] hover:bg-neutral-800 hover:shadow-none {boutResultClass(bout)}"
						style="left: {timeScale(new Date(bout.date))}%; top: {i * 40}px"
					>
						<span class="absolute right-0 hidden h-5 w-max items-center rounded-r-full bg-neutral-800 pr-3 pl-1 text-sm/5 shadow-[0_2px_5px_rgb(0_0_0/16%)] group-hover:flex">
							{boutNameFromBout(bout, true)}
						</span>
					</div>
				{/each}
			{/if}
		{/each}
	</div>
	<div>
		{#each ticks as tick}
			<div class="absolute h-full border-l border-dotted border-neutral-100" style="left: {timeScale(new Date(tick.date))}%" />
			<div class="absolute top-full mt-2 w-max -translate-x-1/2 text-center text-xs font-medium text-neutral-400" style="left: {timeScale(new Date(tick.date))}%">
				<span class="text-neutral-100">{dayjs(tick.date).format(reignsPlotData.ticks.length === 1 ? "MMM YYYY" : "YYYY")}</span><span class="hidden lg:inline"><br />({tick.boxerAge} years old)</span>
			</div>
		{/each}
	</div>
	<div class="absolute top-full w-full border-t-2 border-neutral-100" />
</div>
