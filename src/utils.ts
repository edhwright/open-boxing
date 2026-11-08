import { getLatestTitleReign, getBout } from "./db";
import type { Reign, Bout, Champion, Challenger } from "./types";
import { getCollection } from "astro:content";
import { group } from "d3-array";

// order of weight classes and orgs are important
// display weight classes from heaviest to lightest
// display orgs from oldest to newest (WBA belts are grouped together, The Ring belt goes at the end as it's not a governing body)

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

export const getCurrentChampions = async (): Promise<WeightClassCurrentChampions[]> => {
	const currentChampions = [];

	for (const weightClass of weightClasses) {
		const orgChampions = [];
		for (const org of currentChampionOrgs) {
			// getLatestTitleReign will return null if title doesn't exist.
			// e.g. as The Ring has never had a minimumweight champion, getLatestTitleReign("Minimumweight", "RING") will return null
			orgChampions.push(org === "WBAS" ? await getLatestWbaReign(weightClass.class) : await getLatestTitleReign(weightClass.class, org));
		}
		currentChampions.push({
			weight: weightClass,
			champions: orgChampions,
			undisputed: hasUndisputedChampion(orgChampions),
		});
	}

	return currentChampions;
};

// The WBA counts once: as WBA Super while it has split the weight class, or as the single WBA title where that has
// come back (e.g. Lightweight in 2026). Whichever of the two had the more recent reign begin is the one that counts.
async function getLatestWbaReign(weightClass: string): Promise<Reign | null> {
	const [single, superTitle] = await Promise.all([getLatestTitleReign(weightClass, "WBA"), getLatestTitleReign(weightClass, "WBAS")]);
	if (!single || !superTitle) return superTitle ?? single;
	return single.period.begins > superTitle.period.begins ? single : superTitle;
}

function hasUndisputedChampion(weightClassChampions: (Reign | null)[]): boolean {
	const validOrgs = ["WBA", "WBAS", "WBC", "IBF", "WBO"];
	const validChampions = weightClassChampions.filter((c): c is Reign => Boolean(c)).filter((c) => validOrgs.includes(c.title.org.name.abbreviation));
	// four titles: the WBA (one of the two), WBC, IBF and WBO
	if (validChampions.length < 4) return false;
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

// A bout's thumbnail. The articles' frontmatter names it as /thumbnails/bouts/<bout>.jpg; the file is in
// src/assets/thumbnails/bouts, so Astro can resize and compress it
const thumbnails = import.meta.glob<ImageMetadata>("./assets/thumbnails/bouts/*.jpg", { eager: true, import: "default" });
export function thumbnailImage(path: string | undefined): ImageMetadata | undefined {
	if (!path) return undefined;
	const image = thumbnails[`./assets/thumbnails/bouts/${path.split("/").at(-1)}`];
	if (!image) throw new Error(`No thumbnail ${path.split("/").at(-1)} in src/assets/thumbnails/bouts`);
	return image;
}

export interface FeaturedBoutPreview {
	name: string;
	thumbnail: ImageMetadata | undefined;
	bout: Bout;
}

export async function getAllFeaturedBoutPreviews(): Promise<FeaturedBoutPreview[]> {
	const allFeaturedBoutArticles = await getCollection("bouts", ({ data }) => data.featured);
	const featuredBoutPreviews = await Promise.all(
		[...group(allFeaturedBoutArticles, (a) => a.data.boutId)].map(async ([boutId, articles]) => {
			const bout = await getBout(boutId);
			return {
				name: boutNameFromBout(bout),
				thumbnail: thumbnailImage(articles[0].data.thumbnail),
				bout: bout,
			};
		}),
	);
	return featuredBoutPreviews.sort((a, b) => a.bout.date.localeCompare(b.bout.date));
}

export function filterFeaturedBoutPreviewsByWeightClass(featuredBoutPreviews: FeaturedBoutPreview[], weightClass: string) {
	return featuredBoutPreviews.filter((boutPreview) => boutPreview.bout.weight.class === weightClass);
}

export function filterFeaturedBoutPreviewsByTitle(featuredBoutPreviews: FeaturedBoutPreview[], weightClass: string, org: string) {
	return featuredBoutPreviews.filter(
		(boutPreview) => boutPreview.bout.titles.filter((title) => title.weight.class === weightClass && title.org.name.abbreviation === org).length > 0,
	);
}

export function filterFeaturedBoutPreviewsByChampion(featuredBoutPreviews: FeaturedBoutPreview[], championId: number) {
	return featuredBoutPreviews.filter(
		(boutPreview) =>
			(isChampion(boutPreview.bout.boxers.boxerA) && boutPreview.bout.boxers.boxerA.championId === championId) ||
			(isChampion(boutPreview.bout.boxers.boxerB) && boutPreview.bout.boxers.boxerB.championId === championId),
	);
}
