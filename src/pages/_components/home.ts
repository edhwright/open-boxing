// The home page's data: the current world champions table, upcoming world title bouts and world title changes.
import dayjs from "dayjs";
import { isChampion, slugify } from "../../utils";
import type { WeightClassCurrentChampions } from "../../utils";
import { undisputedTitles } from "../../undisputed";
import type { Bout, Reign, Title } from "../../types";

// the home page's world titles. The WBA counts once, as WBA Super or the single WBA title where that has come back;
// undisputed means holding the WBA, WBC, IBF and WBO (The Ring never counts)
export const homeOrgs = ["WBA", "WBAS", "WBC", "IBF", "WBO", "RING"];
// the table's columns, the first holding whichever WBA title counts
export const columns = [
	{ abbreviation: "WBA", short: "WBA" },
	{ abbreviation: "WBC", short: "WBC" },
	{ abbreviation: "IBF", short: "IBF" },
	{ abbreviation: "WBO", short: "WBO" },
	{ abbreviation: "RING", short: "The Ring" },
];
const majors = ["WBA", "WBAS", "WBC", "IBF", "WBO"];

export interface Org {
	abbreviation: string;
	short: string;
}

export interface ChampionsCell {
	org: Org;
	// null where the title has never had a champion
	reign: { championId: number; name: string; since: string; vacant: boolean; held: number } | null;
	gold: boolean;
}

// the time-held bar runs full width at eight years
const fullBar = 8 * 365.25;

// reigns: the latest reign of each column's title, in column order
export function championsRow(reigns: (Reign | null)[], undisputed: boolean, today: dayjs.Dayjs): ChampionsCell[] {
	return columns.map((column, i) => {
		const reign = reigns[i];
		// the WBA column names the title the reign is for: "WBA Super" or "WBA"
		const org = reign ? { abbreviation: reign.title.org.name.abbreviation, short: reign.title.org.name.short } : column;
		const gold = undisputed && majors.includes(org.abbreviation);
		if (!reign) return { org, reign: null, gold };
		const vacant = reign.period.ends !== null;
		const since = vacant ? (reign.period.ends as string) : reign.period.begins;
		return {
			org,
			gold,
			reign: {
				championId: reign.champion.championId,
				name: `${reign.champion.name.first} ${reign.champion.name.last}`,
				since: dayjs(since).format("D MMM YYYY"),
				vacant,
				held: vacant ? 0 : Math.min(1, today.diff(dayjs(since), "day") / fullBar),
			},
		};
	});
}

// the current world champions table, on the home page and the champions page. getCurrentChampions lists WBA Regular,
// the WBA (Super or single), WBC, IBF, WBO and The Ring: the table leaves out WBA Regular
export function championsTable(currentChampions: WeightClassCurrentChampions[], today: dayjs.Dayjs) {
	return currentChampions.map((wc) => ({
		weight: { ...wc.weight, href: `/${slugify(wc.weight.class)}/` },
		cells: championsRow(wc.champions.slice(1), wc.undisputed, today),
	}));
}

export function ordinal(n: number) {
	const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th";
	return `${n}${suffix}`;
}

// dated items under month headings, in the order given
export function byMonth<T extends { date: string }>(items: T[]) {
	const groups: { month: string; events: (T & { day: string })[] }[] = [];
	for (const item of items) {
		const month = dayjs(item.date).format("MMMM YYYY");
		const event = { ...item, day: ordinal(dayjs(item.date).date()) };
		const last = groups.at(-1);
		if (last && last.month === month) last.events.push(event);
		else groups.push({ month, events: [event] });
	}
	return groups;
}

export interface Person {
	name: string;
	href: string | null;
}

export interface UpcomingBout {
	date: string;
	a: Person;
	b: Person;
	weight: { class: string; href: string };
	orgs: Org[];
	gold: string[];
}

const person = (boxer: Bout["boxers"]["boxerA"]): Person =>
	isChampion(boxer) ? { name: `${boxer.name.first} ${boxer.name.last}`, href: `/champions/${boxer.championId}/` } : { name: boxer.name, href: null };

const weightLink = (weightClass: string) => ({ class: weightClass, href: `/${slugify(weightClass)}/` });

const orgsOf = (titles: Title[]) =>
	titles.filter((t) => homeOrgs.includes(t.org.name.abbreviation)).map((t) => ({ abbreviation: t.org.name.abbreviation, short: t.org.name.short }));

export function upcomingBouts(bouts: Bout[]): UpcomingBout[] {
	return bouts
		.filter((b) => b.status === "SCHEDULED")
		.sort((x, y) => x.date.localeCompare(y.date))
		.map((b) => {
			const orgs = orgsOf(b.titles);
			const ids = [b.boxers.boxerA, b.boxers.boxerB].filter(isChampion).map((x) => x.championId);
			const titleWeight = b.titles[0]?.weight.class ?? b.weight.class;
			const gold = undisputedTitles(ids, titleWeight, b.date, orgs.map((o) => o.abbreviation));
			return { date: b.date, a: person(b.boxers.boxerA), b: person(b.boxers.boxerB), weight: weightLink(b.weight.class), orgs, gold };
		});
}

const methods: Record<string, string> = {
	KO: "knockout",
	TKO: "technical knockout",
	RTD: "corner retirement",
	UD: "unanimous decision",
	SD: "split decision",
	MD: "majority decision",
	PTS: "points",
	DQ: "disqualification",
	TD: "technical decision",
	NWS: "newspaper decision",
};

export interface TitleChange {
	date: string;
	champion: Person;
	// what follows the champion's name, e.g. "beats Josh Taylor via unanimous decision 12/12"
	text: string;
	weight: { class: string; href: string };
	orgs: Org[];
	gold: string[];
	// e.g. "New champion" or "New IBF champion"; null on a defence or vacancy
	newChampion: string | null;
}

// changes to the home page's world titles from `from` to today, newest first: one line per champion, day, weight class
// and kind of change, listing every world title involved
export function titleChanges(reigns: Reign[], bouts: Bout[], from: string): TitleChange[] {
	const home = reigns.filter((r) => homeOrgs.includes(r.title.org.name.abbreviation));
	const byTitle = (r: Reign) => `${r.title.org.name.abbreviation}-${r.title.weight.class}`;
	const titleReigns = Map.groupBy(home, byTitle);

	type Change = { date: string; kind: "won" | "vacated"; reign: Reign; isNew: boolean };
	const changes: Change[] = [];
	for (const reign of home) {
		const others = titleReigns.get(byTitle(reign)) ?? [];
		if (reign.period.begins >= from) {
			// a title changes hands unless the same champion held it up to this day (e.g. a defence recorded as a new reign)
			const before = others.find((r) => r.period.ends === reign.period.begins);
			changes.push({ date: reign.period.begins, kind: "won", reign, isNew: before?.champion.championId !== reign.champion.championId });
		}
		const ends = reign.period.ends;
		// a reign that ends with no new champion the same day: the title is vacated
		if (ends && ends >= from && !others.some((r) => r.period.begins === ends)) {
			changes.push({ date: ends, kind: "vacated", reign, isNew: false });
		}
	}

	const key = (c: Change) => [c.date, c.kind, c.reign.champion.championId, c.reign.title.weight.class].join("|");
	const grouped = [...Map.groupBy(changes, key).values()];
	const orgOrder = (c: Change) => homeOrgs.indexOf(c.reign.title.org.name.abbreviation);

	return grouped
		.map((group) => {
			group.sort((x, y) => orgOrder(x) - orgOrder(y));
			const { date, kind, reign } = group[0];
			const orgs = group.map((c) => ({ abbreviation: c.reign.title.org.name.abbreviation, short: c.reign.title.org.name.short }));
			const weightClass = reign.title.weight.class;
			let text: string;
			const names = listJoin(orgs.map((o) => o.short));
			// "WBA Super" next to a weight class can read as one name ("WBA Super Super Featherweight"), as can the WBA next
			// to a "Super" weight class ("WBA Super Featherweight"), so then the weight class comes after:
			// "the WBA Super world title at Super Featherweight"
			const ambiguous = orgs.some((o) => o.abbreviation === "WBAS" || (o.abbreviation === "WBA" && weightClass.startsWith("Super")));
			const titleName = (noun: string) => (ambiguous ? `the ${names} world ${noun} at ${weightClass}` : `the ${names} ${weightClass} world ${noun}`);
			if (kind === "vacated") {
				text = `vacates ${titleName(orgs.length === 1 ? "title" : "titles")}`;
			} else {
				const bout = bouts.find(
					(b) =>
						b.date === date &&
						b.titles.some((t) => t.org.name.abbreviation === reign.title.org.name.abbreviation && t.weight.class === weightClass) &&
						[b.boxers.boxerA, b.boxers.boxerB].some((x) => isChampion(x) && x.championId === reign.champion.championId),
				);
				text = bout ? boutText(bout, reign.champion.championId) : `becomes ${titleName("champion")}`;
			}
			return {
				date,
				champion: { name: `${reign.champion.name.first} ${reign.champion.name.last}`, href: `/champions/${reign.champion.championId}/` },
				text,
				weight: weightLink(weightClass),
				orgs,
				gold: undisputedTitles([reign.champion.championId], weightClass, date, orgs.map((o) => o.abbreviation)),
				newChampion: newChampion(
					orgs,
					group.filter((c) => c.isNew).map((c) => ({ abbreviation: c.reign.title.org.name.abbreviation, short: c.reign.title.org.name.short })),
				),
			};
		})
		.sort((x, y) => y.date.localeCompare(x.date));
}

// "beats Josh Taylor via unanimous decision 12/12", from the winner's side
function boutText(bout: Bout, championId: number) {
	const isA = isChampion(bout.boxers.boxerA) && bout.boxers.boxerA.championId === championId;
	const opponent = person(isA ? bout.boxers.boxerB : bout.boxers.boxerA).name;
	const method = bout.result.methodOfVictory ? methods[bout.result.methodOfVictory] : null;
	const rounds = bout.result.totalRounds ? `${bout.result.totalRounds}/${bout.scheduledRounds}` : "";
	return ["beats", opponent, method && `via ${method}`, rounds].filter(Boolean).join(" ");
}

// "New champion" where a world title changed hands, never on a defence. With one world title on the line it is
// plain; with several it names the ones that changed hands, as the champion may already hold the others:
// "New IBF champion", or "New WBA Super, WBC and IBF champion"
export function newChampion(orgs: Org[], changed: Org[]): string | null {
	if (changed.length === 0) return null;
	// "New The Ring champion" reads oddly: The Ring's leads as "New Ring champion"
	return orgs.length === 1 ? "New champion" : `New ${listJoin(changed.map((o) => o.short)).replace(/^The /, "")} champion`;
}

// "A, B, C and D"
export function listJoin(names: string[]) {
	return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
