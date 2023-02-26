import dayjs from "dayjs";
import { getLatestTitleReign, getBout, getAllTitles } from "./db";
import type { Reign, Bout, Champion, Challenger, Title } from "./types";
import { getCollection } from "astro:content";
import { group } from "d3-array";

// order of weight classes and orgs are important
// display weight classes from heaviest to lightest
// display orgs from oldest to newest (WBA belts are grouped together, The Ring belt goes at the end as it's not a governing body)

// putting weight classes and orgs in json files would probably be nicer. This works for now

export const weightClasses = [
	{ class: "Heavyweight", lb: "200+" },
	{ class: "Bridgerweight", lb: "224" },
	{ class: "Cruiserweight", lb: "200" },
	{ class: "Light Heavyweight", lb: "175" },
	{ class: "Super Middleweight", lb: "168" },
	{ class: "Middleweight", lb: "160" },
	{ class: "Super Welterweight", lb: "154" },
	{ class: "Welterweight", lb: "147" },
	{ class: "Super Lightweight", lb: "140" },
	{ class: "Lightweight", lb: "135" },
	{ class: "Super Featherweight", lb: "130" },
	{ class: "Featherweight", lb: "126" },
	{ class: "Super Bantamweight", lb: "122" },
	{ class: "Bantamweight", lb: "118" },
	{ class: "Super Flyweight", lb: "115" },
	{ class: "Flyweight", lb: "112" },
	{ class: "Light Flyweight", lb: "108" },
	{ class: "Minimumweight", lb: "105" },
];

export const orgs = ["IBU", "NYSAC", "WBA", "WBAR", "WBAS", "WBC", "IBF", "WBO", "RING"];

export interface WeightClassCurrentChampions {
	weight: {
		class: string;
		lb: string;
	};
	champions: (Reign | null)[];
	undisputed: boolean;
}

const currentChampionOrgs = ["WBAR", "WBAS", "WBC", "IBF", "WBO", "RING"];

export function getCurrentChampions(): WeightClassCurrentChampions[] {
	const currentChampions = [];

	for (const weightClass of weightClasses) {
		const orgChampions = [];
		for (const org of currentChampionOrgs) {
			// getLatestTitleReign will return null if title doesn't exist.
			// e.g. as The Ring has never had a minimumweight champion, getLatestTitleReign("Minimumweight", "RING") will return null
			orgChampions.push(getLatestTitleReign(weightClass.class, org));
		}
		currentChampions.push({
			weight: weightClass,
			champions: orgChampions,
			undisputed: hasUndisputedChampion(orgChampions),
		});
	}

	return currentChampions;
}

export function getCurrentWeightClassChampions(weightClass: string): WeightClassCurrentChampions {
	const orgChampions = currentChampionOrgs.map((org) => getLatestTitleReign(weightClass, org));
	return {
		weight: weightClasses.find((wc) => wc.class === weightClass) as {
			class: string;
			lb: string;
		},
		champions: orgChampions,
		undisputed: hasUndisputedChampion(orgChampions),
	};
}

function hasUndisputedChampion(weightClassChampions: (Reign | null)[]): boolean {
	const validOrgs = ["WBAS", "WBC", "IBF", "WBO"];
	const validChampions = weightClassChampions.filter((c): c is Reign => Boolean(c)).filter((c) => validOrgs.includes(c.title.org.name.abbreviation));
	if (validChampions.length < validOrgs.length) return false;
	return [...new Set(validChampions.map((c) => c.champion.championId))].length === 1;
}

////////

export function boutNameFromBout(bout: Bout, shorten?: boolean): string {
	if (shorten) {
		return `${isChampion(bout.boxers.boxerA) ? bout.boxers.boxerA.name.short : bout.boxers.boxerA.name.split(" ").slice(1).join(" ")} v ${
			isChampion(bout.boxers.boxerB) ? bout.boxers.boxerB.name.short : bout.boxers.boxerB.name.split(" ").slice(1).join(" ")
		}`;
	} else {
		return `${isChampion(bout.boxers.boxerA) ? `${bout.boxers.boxerA.name.first} ${bout.boxers.boxerA.name.last}` : bout.boxers.boxerA.name} v ${
			isChampion(bout.boxers.boxerB) ? `${bout.boxers.boxerB.name.first} ${bout.boxers.boxerB.name.last}` : bout.boxers.boxerB.name
		}`;
	}
}

////////

export function isChampion(boxer: Champion | Challenger): boxer is Champion {
	return (boxer as Champion).championId !== undefined;
}

////////

export function slugify(s: string): string {
	return s.replaceAll(" ", "-").toLowerCase();
}

////////

export interface FeaturedBoutPreview {
	name: string;
	thumbnail: string | undefined;
	bout: Bout;
}

export async function getAllBoutArticlesIds() {
	const allBoutArticles = await getCollection("bouts");
	return [...new Set(allBoutArticles.map((bout) => bout.data.boutId))];
}

export async function getAllFeaturedBoutPreviews(): Promise<FeaturedBoutPreview[]> {
	const allFeaturedBoutArticles = await getCollection("bouts", ({ data }) => data.featured);
	return [...group(allFeaturedBoutArticles, (a) => a.data.boutId)]
		.map(([boutId, articles]) => {
			const bout = getBout(boutId);
			return {
				name: boutNameFromBout(bout),
				thumbnail: articles[0].data.thumbnail,
				bout: bout,
			};
		})
		.sort((a, b) => a.bout.date.localeCompare(b.bout.date));
}

export function filterFeaturedBoutPreviewsByWeightClass(featuredBoutPreviews: FeaturedBoutPreview[], weightClass: string) {
	return featuredBoutPreviews.filter((boutPreview) => boutPreview.bout.weight.class === weightClass);
}

export function filterFeaturedBoutPreviewsByTitle(featuredBoutPreviews: FeaturedBoutPreview[], weightClass: string, org: string) {
	return featuredBoutPreviews.filter(
		(boutPreview) => boutPreview.bout.titles.filter((title) => title.weight.class === weightClass && title.org.name.abbreviation === org).length > 0
	);
}

export function filterFeaturedBoutPreviewsByChampion(featuredBoutPreviews: FeaturedBoutPreview[], championId: number) {
	return featuredBoutPreviews.filter(
		(boutPreview) =>
			(isChampion(boutPreview.bout.boxers.boxerA) && boutPreview.bout.boxers.boxerA.championId === championId) ||
			(isChampion(boutPreview.bout.boxers.boxerB) && boutPreview.bout.boxers.boxerB.championId === championId)
	);
}

////////

export interface TimelineDate {
	date: string;
	events: {
		titleReignsBegin: Reign[] | null;
		titleReignsEnd: Reign[] | null;
		bouts: Bout[] | null;
	};
}

export function geTimelineFromReignsAndBouts(reigns: Reign[], bouts: Bout[]): TimelineDate[] {
	const reignBeginsDates = reigns.map((reign) => reign.period.begins);
	const reignEndsDates = reigns.flatMap((reign) => (reign.period.ends ? [reign.period.ends] : []));
	const boutDates = bouts.map((bout) => bout.date);
	const allDates = [...new Set([...reignBeginsDates, ...reignEndsDates, ...boutDates].sort((a, b) => a.localeCompare(b)))];

	const timeline = allDates.map((date) => {
		return {
			date: date,
			events: {
				titleReignsBegin: reigns.filter((reign) => reign.period.begins === date).length > 0 ? reigns.filter((reign) => reign.period.begins === date) : null,
				titleReignsEnd: reigns.filter((reign) => reign.period.ends === date).length > 0 ? reigns.filter((reign) => reign.period.ends === date) : null,
				bouts: bouts.filter((bout) => bout.date === date).length > 0 ? bouts.filter((bout) => bout.date === date) : null,
			},
		};
	});

	return timeline;
}

////////

export function getChampionRecordFromBouts(championId: number, bouts: Bout[]) {
	const record = { w: 0, l: 0, d: 0, nc: 0 };
	for (const bout of bouts) {
		if (bout.status === "FINISHED") {
			if ((isChampion(bout.boxers.boxerA) && bout.boxers.boxerA.championId === championId) || (isChampion(bout.boxers.boxerB) && bout.boxers.boxerB.championId === championId)) {
				if (bout.result.winner === "DRAW") {
					record.d++;
				} else if (bout.result.winner === "NO CONTEST") {
					record.nc++;
				} else if (bout.result.winner === "BOXER A" && isChampion(bout.boxers.boxerA) && bout.boxers.boxerA.championId === championId) {
					record.w++;
				} else if (bout.result.winner === "BOXER B" && isChampion(bout.boxers.boxerB) && bout.boxers.boxerB.championId === championId) {
					record.w++;
				} else {
					record.l++;
				}
			}
		}
	}

	return record;
}

////////

export interface ReignsPlotData {
	champion: Champion;
	titleData: {
		title: Title;
		reigns: Reign[] | null;
		bouts: Bout[] | null;
	}[];
	ticks: {
		date: string;
		boxerAge: number;
	}[];
	startDate: string;
	endDate: string;
}

export function getReignsPlotData(champion: Champion, championReigns: Reign[], championBouts: Bout[], championTimeline: TimelineDate[]): ReignsPlotData {
	const earliestDate = championTimeline[0].date;
	const isCurrentChampion = championReigns.map((reign) => reign.period.current).includes(true);
	const latestDate =
		isCurrentChampion && dayjs(new Date()).isAfter(dayjs(championTimeline[championTimeline.length - 1].date))
			? dayjs(new Date()).format("YYYY-MM-DD")
			: championTimeline[championTimeline.length - 1].date;

	const tickData: { date: string; boxerAge: number }[] = [];
	// yearly ticks
	// first tick is first 1st january after earliest date
	for (let year = parseInt(dayjs(earliestDate).format("YYYY")) + 1; year <= parseInt(dayjs(latestDate).format("YYYY")); year++) {
		tickData.push({
			date: `${year}-01-01`,
			boxerAge: ageFromDates(champion.born, `${year}-01-01`),
		});
	}

	if (tickData.length === 0) {
		tickData.push({
			date: championTimeline[0].date,
			boxerAge: ageFromDates(champion.born, championTimeline[0].date),
		});
	}

	const allTitles = getAllTitles();
	const titleData: {
		title: Title;
		reigns: Reign[] | null;
		bouts: Bout[] | null;
	}[] = [];

	for (const weightClass of weightClasses) {
		for (const org of orgs) {
			const title = allTitles.find((title) => title.weight.class === weightClass.class && title.org.name.abbreviation === org);
			if (title !== undefined) {
				const reigns = championReigns.filter((reign) => reign.title.weight.class === weightClass.class && reign.title.org.name.abbreviation === org);
				const bouts = championBouts.filter((bout) => bout.titles.filter((title) => title.weight.class === weightClass.class && title.org.name.abbreviation === org).length > 0);

				if (reigns.length > 0 || bouts.length > 0) {
					titleData.push({
						title: title,
						reigns: reigns.length > 0 ? reigns : null,
						bouts: bouts.length > 0 ? bouts : null,
					});
				}
			}
		}
	}

	return {
		champion: champion,
		titleData: titleData,
		ticks: tickData,
		startDate: earliestDate,
		endDate: latestDate,
	};
}

function ageFromDates(startDate: string, endDate: string) {
	return Math.abs(dayjs(endDate).diff(dayjs(startDate), "year"));
}
