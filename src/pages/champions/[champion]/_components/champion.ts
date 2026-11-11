// A champion page's data: the summary, and the reigns and bouts the chart and timeline draw.
// The chart and timeline run in the browser too, so this imports nothing that reads the database.
import dayjs from "dayjs";
import type { Bout, Boxer, Champion, Reign } from "../../../../types";
import { pageReference, type PageReference } from "../../../../references";

const isChampion = (boxer: Boxer): boxer is Champion => (boxer as Champion).championId !== undefined;

export interface Org {
	abbreviation: string;
	short: string;
}

export interface ChampionReign {
	org: Org;
	// the title's weight class
	weight: string;
	begins: string;
	ends: string | null;
	// news reports of its beginning or end
	references: PageReference[];
}

export type Result = "won" | "lost" | "draw" | "nc" | "scheduled";

// a run of text: a champion's name is bold, and links to their page unless it is the page's own champion
export interface Part {
	text: string;
	href?: string;
	bold?: boolean;
}

export interface ChampionBout {
	date: string;
	opponent: string;
	result: Result;
	method: string | null;
	rounds: string;
	// the bout's weight class, which can differ from its titles' (see titles)
	weight: string;
	titles: { org: Org; weight: string }[];
	// e.g. "Jack Dempsey beats Jess Willard via corner retirement 3/12"
	text: string;
	// the same, as runs of text for the timeline
	parts: Part[];
	// the titles to highlight in gold, if it is for an undisputed title (set on the server, from src/undisputed.ts)
	gold: string[];
	// news reports of the bout
	references: PageReference[];
}

export const orgOrder = ["IBU", "NYSAC", "WBA", "WBAR", "WBAS", "WBC", "IBF", "WBO", "RING"];
// heaviest first, as in utils' weightClasses
export const weightOrder = [
	"Heavyweight",
	"Bridgerweight",
	"Cruiserweight",
	"Light Heavyweight",
	"Super Middleweight",
	"Middleweight",
	"Super Welterweight",
	"Welterweight",
	"Super Lightweight",
	"Lightweight",
	"Super Featherweight",
	"Featherweight",
	"Super Bantamweight",
	"Bantamweight",
	"Super Flyweight",
	"Flyweight",
	"Light Flyweight",
	"Minimumweight",
];

const methods: Record<string, string> = {
	KO: "knockout",
	TKO: "technical knockout",
	RTD: "corner retirement",
	UD: "unanimous decision",
	SD: "split decision",
	MD: "majority decision",
	DQ: "disqualification",
	TD: "technical decision",
	PTS: "points decision",
	NWS: "newspaper decision",
};

const orgOf = (title: Reign["title"]): Org => ({ abbreviation: title.org.name.abbreviation, short: title.org.name.short });
const fullName = (champion: Champion) => `${champion.name.first} ${champion.name.last}`;

export function championReigns(reigns: Reign[]): ChampionReign[] {
	return reigns.map((r) => ({ org: orgOf(r.title), weight: r.title.weight.class, begins: r.period.begins, ends: r.period.ends, references: r.references.map(pageReference) }));
}

export function championBouts(champion: Champion, bouts: Bout[]): ChampionBout[] {
	const name = fullName(champion);
	return bouts.map((b) => {
		const isA = isChampion(b.boxers.boxerA) && b.boxers.boxerA.championId === champion.championId;
		const other = isA ? b.boxers.boxerB : b.boxers.boxerA;
		const opponent = isChampion(other) ? fullName(other) : other.name;
		const winner = b.result.winner;
		const result: Result =
			b.status === "SCHEDULED"
				? "scheduled"
				: winner === "DRAW"
					? "draw"
					: winner === "NO CONTEST"
						? "nc"
						: (winner === "BOXER A") === isA
							? "won"
							: "lost";
		const method = b.result.methodOfVictory;
		const rounds = b.result.totalRounds ? `${b.result.totalRounds}/${b.scheduledRounds}` : "";
		const how = [method && method !== "NC" ? `via ${methods[method] ?? method}` : null, rounds].filter(Boolean).join(" ");
		const text =
			result === "won"
				? `${name} beats ${opponent} ${how}`
				: result === "lost"
					? `${opponent} beats ${name} ${how}`
					: result === "draw"
						? `${name} and ${opponent} draw ${how}`
						: result === "nc"
							? `${name} v ${opponent}: no contest ${rounds}`
							: `${name} v ${opponent}`;
		const self: Part = { text: name, bold: true };
		const them: Part = isChampion(other) ? { text: opponent, href: `/champions/${other.championId}/`, bold: true } : { text: opponent };
		const parts: Part[] =
			result === "won"
				? [self, { text: " beats " }, them, { text: ` ${how}` }]
				: result === "lost"
					? [them, { text: " beats " }, self, { text: ` ${how}` }]
					: result === "draw"
						? [self, { text: " and " }, them, { text: ` draw ${how}` }]
						: result === "nc"
							? [self, { text: " v " }, them, { text: `: no contest ${rounds}` }]
							: [self, { text: " v " }, them];
		return {
			date: b.date,
			opponent,
			result,
			method,
			rounds,
			weight: b.weight.class,
			titles: b.titles.map((t) => ({ org: orgOf(t), weight: t.weight.class })),
			text: text.trim(),
			// only the last run's trailing space goes (from an empty "via …"); the spaces between runs stay
			parts: parts.map((p, i) => (i === parts.length - 1 ? { ...p, text: p.text.trimEnd() } : p)).filter((p) => p.text),
			gold: [],
			references: b.references.map(pageReference),
		};
	});
}

// "A, B, C and D"
export const listJoin = (names: string[]) => (names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const byWeightThenOrg = (a: ChampionReign, b: ChampionReign) =>
	weightOrder.indexOf(a.weight) - weightOrder.indexOf(b.weight) || orgOrder.indexOf(a.org.abbreviation) - orgOrder.indexOf(b.org.abbreviation);

// "Jack Dempsey held the IBU, NYSAC, WBA and The Ring heavyweight world titles between 1919 and 1926. Dempsey fought
// 8 world title bouts, winning 6 and losing 2." The short name, not a pronoun, starts the second sentence. As parts, so
// the page can show each world title as a highlighted link to its page; `org` is set on a world title's part
export interface SummaryPart {
	text: string;
	org?: string;
	href?: string;
}
const slug = (s: string) => s.replaceAll(" ", "-").toLowerCase();
// WBA Super is on the WBA's page
const titlePage = (org: string, weight: string) => `/${slug(weight)}/${slug(org === "WBAS" ? "WBA" : org)}/`;

export function summary(champion: Champion, reigns: ChampionReign[], bouts: ChampionBout[]): SummaryPart[] {
	const titles = [...new Map([...reigns].sort(byWeightThenOrg).map((r) => [`${r.org.abbreviation}:${r.weight}`, r])).values()];
	const groups = Map.groupBy(titles, (r) => r.weight);
	const join = <T>(items: T[][], last = " and "): T[] => items.flatMap((x, i) => (i === 0 ? x : [{ text: i === items.length - 1 ? last : ", " } as T, ...x]));
	// "the WBC and The Ring super featherweight world titles", without doubling "the" before The Ring
	const named = (rs: ChampionReign[]): SummaryPart[] => [
		...(rs[0].org.short.startsWith("The ") ? [] : [{ text: "the " }]),
		...join(rs.map((r) => [{ text: r.org.short, org: r.org.abbreviation, href: titlePage(r.org.abbreviation, r.weight) }])),
		{ text: ` ${rs[0].weight.toLowerCase()} world ${rs.length === 1 ? "title" : "titles"}` },
	];
	// up to three weight classes are named in full, with the years; more read as a range, lightest to heaviest
	const weights = [...groups.keys()];
	const first = dayjs(reigns.map((r) => r.begins).sort()[0]).year();
	const current = reigns.some((r) => r.ends === null);
	const last = dayjs(reigns.map((r) => r.ends ?? "").sort().at(-1)).year();
	const when = current ? `since ${first}` : first === last ? `in ${first}` : `between ${first} and ${last}`;
	const held: SummaryPart[] =
		weights.length <= 3
			? [...join([...groups.values()].map(named)), { text: ` ${when}` }]
			: [{ text: `${plural(titles.length, "world title")} across ${weights.length} weight classes, from ${weights.at(-1)!.toLowerCase()} to ${weights[0].toLowerCase()}` }];

	const finished = bouts.filter((b) => b.result !== "scheduled");
	const count = (r: Result) => finished.filter((b) => b.result === r).length;
	const outcomes = [
		count("won") && `winning ${count("won")}`,
		count("lost") && `losing ${count("lost")}`,
		count("draw") && `drawing ${count("draw")}`,
		count("nc") && `with ${plural(count("nc"), "no contest")}`,
	].filter(Boolean) as string[];

	const parts: SummaryPart[] = [];
	if (reigns.length) parts.push({ text: `${fullName(champion)} ${current ? "has held" : "held"} ` }, ...held, { text: "." });
	if (finished.length)
		parts.push({ text: `${parts.length ? " " : ""}${champion.name.short} ${current ? "has fought" : "fought"} ${plural(finished.length, "world title bout")}${outcomes.length ? `, ${listJoin(outcomes)}` : ""}.` });
	return parts;
}

// the summary figures: world title bouts, record, world titles held, longest reign
export function figures(reigns: ChampionReign[], bouts: ChampionBout[], today: string) {
	const finished = bouts.filter((b) => b.result !== "scheduled");
	const count = (r: Result) => finished.filter((b) => b.result === r).length;
	const draws = count("draw");
	const titles = new Set(reigns.map((r) => `${r.org.abbreviation}:${r.weight}`));
	const stats = [
		{ value: String(finished.length), label: "World title bouts" },
		{ value: `${count("won")}–${count("lost")}${draws ? `–${draws}` : ""}`, label: `Record in world title bouts (won–lost${draws ? "–drawn)" : ")"}` },
		{ value: String(titles.size), label: "World titles held" },
	];
	const longest = [...reigns].sort((a, b) => dayjs(b.ends ?? today).diff(b.begins, "day") - dayjs(a.ends ?? today).diff(a.begins, "day"))[0];
	if (longest) {
		const months = dayjs(longest.ends ?? today).diff(longest.begins, "month");
		const value = months < 1 ? plural(dayjs(longest.ends ?? today).diff(longest.begins, "day"), "day") : [months >= 12 && plural(Math.floor(months / 12), "year"), months % 12 && plural(months % 12, "month")].filter(Boolean).join(", ");
		const [from, to] = [dayjs(longest.begins).year(), longest.ends ? dayjs(longest.ends).year() : "present"];
		const years = from === to ? String(from) : `${from}–${to}`;
		stats.push({ value, label: `Longest world title reign (${longest.org.short} ${longest.weight.toLowerCase()}, ${years})` });
	}
	return stats;
}
