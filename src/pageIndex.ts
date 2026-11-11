// Every page's name, what kind of page it is and its address, worked out once at build time. The header's search
// (pages/search.json.ts) and the pages' social images (pages/og/[...page].png.ts) both come from it. `also` holds other
// names a page goes by, e.g. an organisation's full name, which match a search but are not shown.
import { getCollection } from "astro:content";
import { getAllChampions, getAllTitles, getBout } from "./db";
import { boutNameFromBout, slugify } from "./utils";
import { fullDate } from "./dates";
import { getBladeIssues } from "./pages/articles/_components/blade";

export interface PageEntry {
	name: string;
	// the small line above the name on the page's social image; null for none
	kind: string | null;
	slug: string;
	also?: string;
}

const build = async (): Promise<PageEntry[]> => {
	const titles = await getAllTitles();

	const champions: PageEntry[] = (await getAllChampions()).map((champion) => ({
		name: `${champion.name.first} ${champion.name.last}`,
		kind: "World champion",
		slug: `champions/${champion.championId}`,
	}));

	const weightClasses: PageEntry[] = [...new Set(titles.map((title) => title.weight.class))].map((weightClass) => ({
		name: weightClass,
		kind: null,
		slug: slugify(weightClass),
	}));

	// as the world title pages name them, e.g. "WBA heavyweight world title". WBA Super is on the WBA's page, so a
	// search for it finds that
	const hasSuper = (weightClass: string) => titles.some((t) => t.weight.class === weightClass && t.org.name.abbreviation === "WBAS");
	const worldTitles: PageEntry[] = titles
		.filter((title) => title.org.name.abbreviation !== "WBAS")
		.map((title) => ({
			name: `${title.org.name.short} ${title.weight.class.toLowerCase()} world title`,
			kind: null,
			slug: `${slugify(title.weight.class)}/${slugify(title.org.name.abbreviation)}`,
			also: `${title.org.name.full} ${title.org.name.abbreviation}${title.org.name.abbreviation === "WBA" && hasSuper(title.weight.class) ? " WBA Super" : ""}`,
		}));

	// every bout with articles has a page of them
	const boutIds = [...new Set((await getCollection("bouts")).map((a) => a.data.boutId))];
	const bouts: PageEntry[] = await Promise.all(
		boutIds.map(async (id) => {
			const bout = await getBout(id);
			const name = boutNameFromBout(bout);
			return { name, kind: fullDate(bout.date), slug: `articles/${bout.date}-${slugify(name)}` };
		}),
	);

	const bladeIssues: PageEntry[] = (await getBladeIssues()).map(({ issue }) => ({
		name: `The Boxing Blade, ${fullDate(issue.data.publicationDate)}`,
		kind: `Volume ${issue.data.volume}, number ${issue.data.number}`,
		slug: `articles/the-boxing-blade/volume-${issue.data.volume}-number-${issue.data.number}`,
	}));

	const pages: PageEntry[] = [
		{ name: "Current world champions", kind: null, slug: "champions" },
		{ name: "Data", kind: null, slug: "data", also: "download csv" },
		{ name: "Champion timeline comparison", kind: "Interactive", slug: "data/timeline" },
		{ name: "Full timeline", kind: "Interactive", slug: "data/full-timeline" },
		{ name: "Head to head", kind: "Interactive", slug: "data/head-to-head" },
		{ name: "Articles", kind: null, slug: "articles" },
		{ name: "The Boxing Blade", kind: null, slug: "articles/the-boxing-blade" },
		{ name: "API", kind: null, slug: "api" },
	];

	return [...pages, ...champions, ...weightClasses, ...worldTitles, ...bouts, ...bladeIssues].sort((a, b) => a.name.localeCompare(b.name));
};

let index: Promise<PageEntry[]> | undefined;
export const getPageIndex = () => (index ??= build());
