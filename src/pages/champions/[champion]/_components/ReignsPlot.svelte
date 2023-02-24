<script lang="ts">
	import { isChampion, boutNameFromBout } from "../../../../utils";
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
			return "scheduled";
		} else if (bout.result.winner === "DRAW") {
			return "draw";
		} else if (bout.result.winner === "NO CONTEST") {
			return "no-contest";
		} else if (bout.result.winner === "BOXER A" && isChampion(bout.boxers.boxerA) && bout.boxers.boxerA.championId === reignsPlotData.champion.championId) {
			return "won";
		} else if (bout.result.winner === "BOXER B" && isChampion(bout.boxers.boxerB) && bout.boxers.boxerB.championId === reignsPlotData.champion.championId) {
			return "won";
		} else {
			return "lost";
		}
	}
</script>

<div class="plot" style="height: {plotHeight}px">
	<div>
		{#each reignsPlotData.titleData as titleData, i}
			<div class="plot__org" style="top: {i * 40}px">{titleData.title.org.name.abbreviation}</div>
		{/each}
	</div>
	<div>
		{#each weightClassYLabelPositions as weightClassLabel}
			<div class="plot__line" style="top: {weightClassLabel.index * 40}px" />
			<div class="plot__weight" style="top: {weightClassLabel.index * 40}px">{weightClassLabel.class}</div>
		{/each}
	</div>
	<div>
		{#each reignsPlotData.titleData as titleData, i}
			{#if titleData.reigns}
				{#each titleData.reigns as reign}
					<div
						class="plot__reign"
						style="left: {timeScale(new Date(reign.period.begins))}%; 
                        width: calc({timeScale(reign.period.current || !reign.period.ends ? new Date(dayjs().format('YYYY-MM-DD')) : new Date(reign.period.ends))}% - {timeScale(
							new Date(reign.period.begins)
						)}%); 
                        top: {i * 40 + 10}px;
                        background-color: var(--{reign.title.org.name.abbreviation.toLowerCase()}-bg)"
					/>
				{/each}
			{/if}
			{#if titleData.bouts}
				{#each titleData.bouts as bout}
					<div
						class="plot__bout plot--tooltip plot--{boutResultClass(bout)}"
						style="left: {timeScale(new Date(bout.date))}%; top: {i * 40}px"
						data-text={boutNameFromBout(bout, true)}
					/>
				{/each}
			{/if}
		{/each}
	</div>
	<div>
		{#each ticks as tick}
			<div class="plot__tick" style="left: {timeScale(new Date(tick.date))}%" />
			<div class="plot__date" style="left: {timeScale(new Date(tick.date))}%">
				<span class="plot__year">{dayjs(tick.date).format(reignsPlotData.ticks.length === 1 ? "MMM YYYY" : "YYYY")}</span><span class="plot__age"
					><br />({tick.boxerAge} years old)</span
				>
			</div>
		{/each}
	</div>
	<div class="plot__baseline" />
</div>

<style>
	.plot {
		position: relative;
		width: calc(100% - 162px); /* full width minus the margin */
		margin-left: 162px;
		margin-bottom: 48px;
		background-image: linear-gradient(
			0deg,
			var(--theme-border) 0%,
			var(--theme-border) 1%,
			var(--theme-content-bg) 1%,
			var(--theme-content-bg) 49%,
			var(--theme-border) 49%,
			var(--theme-border) 50%,
			var(--theme-border) 51%,
			var(--theme-content-bg) 51%,
			var(--theme-content-bg) 99%,
			var(--theme-border) 99%,
			var(--theme-border) 100%
		);
		background-size: 100% 80px;
		background-repeat: repeat-y;
	}

	.plot__org {
		position: absolute;
		left: -60px;
		font-size: var(--font-size-small);
		line-height: 20px;
		font-weight: 500;
		color: var(--theme-text-secondary);
		transform: translateY(10px);
	}

	.plot__tick {
		position: absolute;
		height: 100%;
		border-left: 1px dotted var(--theme-text);
	}

	.plot__date {
		position: absolute;
		top: calc(100% + 8px);
		transform: translateX(-50%);
		text-align: center;
		width: max-content;
		color: var(--theme-text-secondary);
		font-size: var(--font-size-small);
		line-height: var(--line-height-small);
		font-weight: 500;
	}

	.plot__year {
		color: var(--theme-text);
	}

	.plot__age {
		color: var(--theme-text-secondary);
	}

	.plot__baseline {
		position: absolute;
		top: 100%;
		width: 100%;
		border-top: 2px solid var(--theme-text);
	}

	.plot__line {
		position: absolute;
		width: calc(100% + 162px);
		transform: translateX(-162px);
		border-top: 1px solid var(--theme-text-secondary);
	}

	.plot__weight {
		position: absolute;
		left: -162px;
		font-size: var(--font-size-small);
		line-height: var(--line-height-small);
		transform: translateY(6px);
		width: 100px;
		font-weight: 500;
	}

	.plot__reign {
		position: absolute;
		height: 20px;
	}

	.plot__bout {
		position: absolute;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		transform: translate(-10px, 10px);
		/* background-color: rgba(0, 178, 0); */
		z-index: 1;
		box-shadow: rgb(0 0 0 / 16%) 0px 1px 4px, inset 0px 0px 0px 2px white;
		/* background-image: radial-gradient(circle, rgba(255, 255, 255, 0) 33%, var(--theme-content-bg) 33%, var(--theme-content-bg) 99%, rgba(255, 255, 255, 0) 100%); */
		/* background-image: radial-gradient(circle, rgba(255, 255, 255, 0) 55%, rgb(255, 255, 255) 55%, rgb(255, 255, 255) 99%, rgba(255, 255, 255, 0) 100%); */
		/* background-image: radial-gradient(circle, rgba(255, 255, 255, 0) 55%, black 55%, black 99%, rgba(255, 255, 255, 0) 100%); */
		/* border: 2px solid white; */
	}

	.plot__bout:hover {
		box-shadow: none;
		background-color: var(--theme-content-bg);
	}

	.plot--scheduled {
		background-color: var(--theme-content-bg);
	}

	.plot--draw {
		background-color: #c0c0c0;
	}

	.plot--no-contest {
		background-color: #c0c0c0;
	}

	.plot--won {
		/* background-color: #a5eea0; */
		background-color: #77dd77;
	}

	.plot--lost {
		/* background-color: #ff9688; */
		background-color: #ff6961;
	}

	.plot--tooltip:before {
		display: none;
		position: absolute;
		content: attr(data-text);
		transform: translateX(calc(-100% + 20px));
		width: max-content;
		/* background-color: rgba(255, 255, 255, 1); */
		/* background-color: var(--theme-highlight-bg);
		color: var(--theme-highlight-text); */

		/* background-color: white; */
		height: 20px;
		line-height: 20px;
		font-size: var(--font-size-medium);
		padding: 0 12px 0 4px;
		box-shadow: rgb(0 0 0 / 16%) 0px 2px 5px;
		/* background-color: rgb(62, 67, 74); */
		background-color: var(--theme-content-bg);
		/* color: rgb(202, 219, 216); */
		color: var(--theme-text);
		border-radius: 0 10px 10px 0;
	}

	.plot--tooltip:hover:before {
		/* display: block; */
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.plot__age {
		display: none;
	}

	@media (min-width: 1024px) {
		.plot__age {
			display: initial;
		}
	}
</style>
