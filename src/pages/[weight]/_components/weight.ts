// The weight class and world title pages' data: one template, for every world title at a weight class or for one.
import dayjs from "dayjs";
import { isChampion, slugify } from "../../../utils";
import { undisputedTitles } from "../../../undisputed";
import type { Bout, Reign, Title } from "../../../types";
import { nearerEnd, pageReference, type PageReference } from "../../../references";

export type { PageReference };
import { marksNbaToWba, nbaToWba, type Model } from "../../../timeline/timeline";
import { orgTagsHTML, tints } from "../../../components/orgTags";

export interface Org {
	abbreviation: string;
	short: string;
}

// a run of text: a champion's name is bold and links to their page
export interface Part {
	text: string;
	href?: string;
	bold?: boolean;
}

export interface PageReign {
	id: number;
	org: Org;
	championId: number;
	name: string;
	begins: string;
	ends: string | null;
	// the day it ended, or today
	to: string;
	days: number;
	defences: number;
	references: PageReference[];
}

export type Outcome = "A" | "B" | "draw" | "nc" | "scheduled";

export interface PageBout {
	date: string;
	a: { name: string; id: number | null };
	b: { name: string; id: number | null };
	outcome: Outcome;
	// the bout's world titles at this weight class (all of them, on a world title page too)
	orgs: Org[];
	gold: string[];
	text: string;
	parts: Part[];
	references: PageReference[];
}

// lanes and columns run oldest organisation first; The Ring, not a sanctioning body, comes last
export const orgOrder = ["IBU", "NYSAC", "WBA", "WBAS", "WBAR", "WBC", "IBF", "WBO", "RING"];
const byOrg = (a: Org, b: Org) => orgOrder.indexOf(a.abbreviation) - orgOrder.indexOf(b.abbreviation);

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

export const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
// "4th Jul 1923"
export const longDate = (iso: string) => `${ordinal(dayjs(iso).date())} ${dayjs(iso).format("MMM YYYY")}`;
// "4th July 1923"
export const fullDate = (iso: string) => `${ordinal(dayjs(iso).date())} ${dayjs(iso).format("MMMM YYYY")}`;
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
export const listJoin = (names: string[]) => (names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);
// "7 years, 2 months", or days under a month
export function lengthOf(from: string, to: string) {
	const months = dayjs(to).diff(from, "month");
	if (months < 1) return plural(dayjs(to).diff(from, "day"), "day");
	return months < 12 ? plural(months, "month") : [plural(Math.floor(months / 12), "year"), months % 12 && plural(months % 12, "month")].filter(Boolean).join(", ");
}
export const span = (r: PageReign) => `${dayjs(r.begins).year()}–${r.ends ? dayjs(r.ends).year() : "present"}`;
// the WBA Super world title has no page of its own: it carries on the WBA world title, so it is on the WBA's page
export const pageOrg = (org: string) => (org === "WBAS" ? "WBA" : org);
export const titleHref = (weightClass: string, org: string) => `/${slugify(weightClass)}/${slugify(pageOrg(org))}/`;

const orgOf = (t: Title): Org => ({ abbreviation: t.org.name.abbreviation, short: t.org.name.short });

export function pageBouts(bouts: Bout[], weightClass: string): PageBout[] {
	return bouts.map((b) => {
		const titles = b.titles.filter((t) => t.weight.class === weightClass);
		const orgs = titles.map(orgOf).sort(byOrg);
		const side = (x: Bout["boxers"]["boxerA"]) => (isChampion(x) ? { name: `${x.name.first} ${x.name.last}`, id: x.championId } : { name: x.name, id: null });
		const [a, bb] = [side(b.boxers.boxerA), side(b.boxers.boxerB)];
		const winner = b.result.winner;
		const outcome: Outcome = b.status === "SCHEDULED" ? "scheduled" : winner === "BOXER A" ? "A" : winner === "BOXER B" ? "B" : winner === "DRAW" ? "draw" : "nc";
		const method = b.result.methodOfVictory;
		const rounds = b.result.totalRounds ? `${b.result.totalRounds}/${b.scheduledRounds}` : "";
		const how = [method && method !== "NC" ? `via ${methods[method] ?? method}` : null, rounds].filter(Boolean).join(" ");
		const part = (x: { name: string; id: number | null }): Part => (x.id ? { text: x.name, href: `/champions/${x.id}/`, bold: true } : { text: x.name });
		const [w, l] = outcome === "B" ? [bb, a] : [a, bb];
		const parts: Part[] =
			outcome === "A" || outcome === "B"
				? [part(w), { text: " beats " }, part(l), { text: how ? ` ${how}` : "" }]
				: outcome === "draw"
					? [part(a), { text: " and " }, part(bb), { text: ` draw ${how}`.trimEnd() }]
					: outcome === "nc"
						? [part(a), { text: " v " }, part(bb), { text: " ends in a no contest" }]
						: [part(a), { text: " v " }, part(bb)];
		const ids = [a.id, bb.id].filter((id): id is number => id !== null);
		return {
			date: b.date,
			a,
			b: bb,
			outcome,
			orgs,
			gold: undisputedTitles(ids, weightClass, b.date, orgs.map((o) => o.abbreviation)),
			text: parts.map((p) => p.text).join(""),
			parts: parts.filter((p) => p.text),
			references: b.references.map(pageReference),
		};
	});
}

export const winnerOf = (b: PageBout) => (b.outcome === "A" ? b.a : b.outcome === "B" ? b.b : null);
export const loserOf = (b: PageBout) => (b.outcome === "A" ? b.b : b.outcome === "B" ? b.a : null);

export function pageReigns(reigns: Reign[], bouts: PageBout[], today: string): PageReign[] {
	return reigns.map((r, id) => {
		const org = orgOf(r.title);
		const to = r.period.ends ?? today;
		// a successful defence: a world title bout for this title during the reign, won by the champion
		const defences = bouts.filter(
			(b) => b.orgs.some((o) => o.abbreviation === org.abbreviation) && b.date > r.period.begins && b.date <= to && winnerOf(b)?.id === r.champion.championId,
		).length;
		return {
			id,
			org,
			championId: r.champion.championId,
			name: `${r.champion.name.first} ${r.champion.name.last}`,
			begins: r.period.begins,
			ends: r.period.ends,
			to,
			days: dayjs(to).diff(r.period.begins, "day"),
			defences,
			references: r.references.map(pageReference),
		};
	});
}

// the summary sentence and figures
export function summary(weightClass: string, org: Org | null, reigns: PageReign[], bouts: PageBout[], active: boolean) {
	const finished = bouts.filter((b) => b.outcome !== "scheduled");
	const champions = new Set(reigns.map((r) => r.championId));
	const firstYear = Math.min(...reigns.map((r) => dayjs(r.begins).year()), ...bouts.map((b) => dayjs(b.date).year()));
	const longest = [...reigns].sort((a, b) => b.days - a.days)[0];

	if (org) {
		const latest = reigns.at(-1);
		const now = !latest
			? "It has never had a champion."
			: !latest.ends
				? `Current champion: ${latest.name}, since ${longDate(latest.begins)}.`
				: active
					? `Vacant since ${longDate(latest.ends)}.`
					: `Last held in ${dayjs(latest.ends).year()}; no longer contested.`;
		const text = reigns.length
			? `Covers world title bouts since ${firstYear}. ${now}`
			: `The ${org.short} ${weightClass.toLowerCase()} world title has never had a champion.`;
		const mostDefences = [...reigns].sort((a, b) => b.defences - a.defences)[0];
		const stats = [
			{ value: String(finished.length), label: "World title bouts" },
			{ value: String(champions.size), label: "Champions" },
		];
		if (longest) stats.push({ value: lengthOf(longest.begins, longest.to), label: `Longest reign (${longest.name}, ${span(longest)})` });
		if (mostDefences) stats.push({ value: String(mostDefences.defences), label: `Most successful defences in one reign (${mostDefences.name}, ${span(mostDefences)})` });
		// the page's description, for search results, naming the world title (`name`, as the page's heading has it)
		const description = (name: string) =>
			reigns.length === 0
				? `The ${name} has never had a champion.`
				: active || !latest!.ends
					? `The ${name} since ${firstYear}: every champion, reign and bout. ${latest!.ends ? `Vacant since ${longDate(latest!.ends)}.` : `Current champion: ${latest!.name}.`}`
					: `The ${name} from ${firstYear} to ${dayjs(latest!.ends).year()}: every champion, reign and bout.`;
		return { text: text.replace(/^The The /, "The "), description, stats, orgs: null };
	}

	const orgs = [...new Map(reigns.map((r) => [r.org.abbreviation, r.org])).values()].sort(byOrg);
	// the page shows the world titles as linked tags (see WeightTitlePage); this plain text is the page's description.
	// WBA Super is on the WBA's page, so it is not listed apart
	const pages = orgs.filter((o) => o.abbreviation !== "WBAS" || !orgs.some((x) => x.abbreviation === "WBA"));
	const text = `Data covering ${listJoin(pages.map((o) => o.short))} world title bouts and reigns.`;
	const description = () =>
		`${weightClass} world titles since ${firstYear}: current world champions, and every reign and bout from ${pages[0].short.startsWith("The ") ? "" : "the "}${listJoin(pages.map((o) => o.short))}.`;
	// the boxer in the most world title bouts at this weight class
	const boutsBy = new Map<number, PageBout[]>();
	for (const b of finished) for (const x of [b.a, b.b]) if (x.id) boutsBy.set(x.id, [...(boutsBy.get(x.id) ?? []), b]);
	const [busiestId, busiestBouts] = [...boutsBy].sort((a, b) => b[1].length - a[1].length)[0] ?? [null, []];
	const busiest = reigns.find((r) => r.championId === busiestId);
	const won = busiestBouts.filter((b) => winnerOf(b)?.id === busiestId).length;
	const lost = busiestBouts.filter((b) => loserOf(b)?.id === busiestId).length;
	const stats = [
		{ value: String(finished.length), label: "World title bouts" },
		{ value: String(champions.size), label: "World champions" },
	];
	if (longest) stats.push({ value: lengthOf(longest.begins, longest.to), label: `Longest world title reign (${longest.name}, ${longest.org.short}, ${span(longest)})` });
	if (busiest) stats.push({ value: String(busiestBouts.length), label: `Most world title bouts (${busiest.name}, won ${won}, lost ${lost})` });
	return { text, description, stats, orgs: pages };
}

export interface Holder {
	org: Org;
	href: string;
	// null where the title has never had a champion
	reign: { championId: number; name: string; since: string; vacant: boolean; held: number } | null;
	gold: boolean;
}

const fullBar = 8 * 365.25;

// who holds each of the weight class's active world titles now; gold where one champion is undisputed. WBA and WBA
// Super are one line, so where both are still active only the one with the latest reign shows
export function holders(weightClass: string, titles: Title[], reigns: PageReign[], undisputedNow: string[], today: string): Holder[] {
	const latestBegins = (org: string) => reigns.filter((r) => r.org.abbreviation === org).at(-1)?.begins ?? "";
	const superIsCurrent = latestBegins("WBAS") > latestBegins("WBA");
	return titles
		.filter((t) => t.weight.class === weightClass && t.active)
		.map(orgOf)
		.filter((o, _, all) => !(all.some((x) => x.abbreviation === "WBA") && all.some((x) => x.abbreviation === "WBAS") && o.abbreviation === (superIsCurrent ? "WBA" : "WBAS")))
		.sort(byOrg)
		.map((org) => {
			const last = reigns.filter((r) => r.org.abbreviation === org.abbreviation).at(-1);
			const gold = undisputedNow.includes(org.abbreviation);
			const href = titleHref(weightClass, org.abbreviation);
			if (!last) return { org, href, reign: null, gold };
			const vacant = last.ends !== null;
			const since = vacant ? (last.ends as string) : last.begins;
			return {
				org,
				href,
				gold,
				reign: {
					championId: last.championId,
					name: last.name,
					since: longDate(since),
					vacant,
					held: vacant ? 0 : Math.round(Math.min(1, dayjs(today).diff(since, "day") / fullBar) * 100),
				},
			};
		});
}

// the longest reigns: one row per champion (their longest) on a weight class page, every reign on a world title page.
// A row has a stripe per world title held through it: usually one, more when several were held for the same length
export function longestReigns(reigns: PageReign[], forTitle: boolean) {
	let ranked: PageReign[];
	if (forTitle) ranked = [...reigns].sort((a, b) => b.days - a.days);
	else {
		const best = new Map<number, PageReign>();
		for (const r of reigns) if (!best.has(r.championId) || r.days > best.get(r.championId)!.days) best.set(r.championId, r);
		ranked = [...best.values()].sort((a, b) => b.days - a.days).slice(0, 10);
	}
	const heldWith = (r: PageReign) =>
		forTitle ? [r] : reigns.filter((o) => o.championId === r.championId && Math.abs(o.days - r.days) <= 3 && o.begins < r.to && o.to > r.begins).sort((a, b) => byOrg(a.org, b.org));
	const ms = (iso: string) => dayjs(iso).valueOf();
	const spanDays = (rs: PageReign[]) => (Math.max(...rs.map((o) => ms(o.to))) - Math.min(...rs.map((o) => ms(o.begins)))) / 86400000;
	const maxDays = Math.max(1, ...ranked.map((r) => spanDays(heldWith(r))));
	return ranked.map((r, i) => {
		const group = heldWith(r);
		const start = Math.min(...group.map((o) => ms(o.begins)));
		return {
			rank: i + 1,
			championId: r.championId,
			name: r.name,
			orgs: group.map((o) => o.org),
			years: span(r),
			length: lengthOf(r.begins, r.to),
			defences: plural(r.defences, "successful defence"),
			stripes: group.map((o) => ({
				org: o.org.abbreviation,
				title: `${o.org.short}, ${span(o)}`,
				left: Math.round(((ms(o.begins) - start) / 86400000 / maxDays) * 1000) / 10,
				width: Math.max(0.5, Math.round((o.days / maxDays) * 1000) / 10),
			})),
		};
	});
}

// The WBA's main line changing name: the WBA world title becoming WBA Super, and WBA Super becoming the WBA world title
// again where the WBA went back to one champion. `champion` is set where one champion held it across the change
export interface WbaChange {
	date: string;
	from: Org;
	to: Org;
	champion: PageReign | null;
	// the reigns either side, so their own "vacates" and "becomes" lines can give way to the change's
	before: PageReign;
	after: PageReign;
}

export function wbaChanges(reigns: PageReign[]): WbaChange[] {
	const line = reigns.filter((r) => r.org.abbreviation === "WBA" || r.org.abbreviation === "WBAS").sort((a, b) => a.begins.localeCompare(b.begins));
	return line.slice(1).flatMap((after, i) => {
		const before = line[i];
		if (before.org.abbreviation === after.org.abbreviation) return [];
		const champion = before.championId === after.championId && before.ends === after.begins ? after : null;
		return [{ date: after.begins, from: before.org, to: after.org, champion, before, after }];
	});
}

// "The WBA world title becomes the WBA Super world title", or a champion's
const wbaChangeParts = (c: WbaChange): Part[] => {
	const to = c.to.abbreviation === "WBAS" ? "the WBA Super world title" : "the WBA world title";
	return c.champion
		? [{ text: c.champion.name, href: `/champions/${c.champion.championId}/`, bold: true }, { text: `'s ${c.from.short} world title becomes ${to}` }]
		: [{ text: `The ${c.from.short} world title becomes ${to}` }];
};
export const wbaChangeLabel = (c: WbaChange) => (c.to.abbreviation === "WBAS" ? "The WBA title becomes WBA Super" : "WBA Super becomes the WBA title");

export interface TimelineEvent {
	date: string;
	parts: Part[];
	orgs: Org[];
	gold: string[];
	// e.g. "New champion" or "New IBF champion"; null on a defence
	newChampion: string | null;
	scheduled: boolean;
	isBout: boolean;
	references: PageReference[];
}

// "New champion" where a world title changed hands, never on a defence. With one world title on the line it is
// plain; with several it names the ones that changed hands, as the champion may already hold the others:
// "New IBF champion", or "New WBA Super, WBC and IBF champion"
export function newChampionLabel(orgs: Org[], changed: Org[]): string | null {
	if (changed.length === 0) return null;
	// "New The Ring champion" reads oddly: The Ring's leads as "New Ring champion"
	return orgs.length === 1 ? "New champion" : `New ${listJoin(changed.map((o) => o.short)).replace(/^The /, "")} champion`;
}


// world title bouts, plus world titles won or given up away from a bout, one line per champion and date
export function timelineEvents(weightClass: string, reigns: PageReign[], bouts: PageBout[]): TimelineEvent[] {
	const events: TimelineEvent[] = bouts.map((b) => ({
		date: b.date,
		parts: b.parts,
		orgs: b.orgs,
		gold: b.gold,
		newChampion: newChampionLabel(
			b.orgs,
			b.orgs.filter((o) => reigns.some((r) => r.org.abbreviation === o.abbreviation && r.begins === b.date && r.championId === winnerOf(b)?.id)),
		),
		scheduled: b.outcome === "scheduled",
		isBout: true,
		references: b.references,
	}));
	const the = (s: string) => (s.startsWith("The ") ? s : `the ${s}`);
	// a reign that ends or begins at a bout for that title needs no line of its own: the bout says it. A champion who
	// fights for another title, e.g. WBA Super while holding the WBA or WBA Regular, vacates theirs, so that is a line.
	// Where one champion's WBA world title becomes WBA Super (or back), the change says so, rather than their
	// vacating one title and becoming champion of the other
	const changes = wbaChanges(reigns);
	const carried = { ends: new Set(changes.filter((c) => c.champion).map((c) => c.before)), begins: new Set(changes.filter((c) => c.champion).map((c) => c.after)) };
	// on the same day: titles vacated, then bouts, then new champions away from a bout. A champion often vacates one
	// title to fight for another, and a vacancy comes before the new champion who fills it
	const step = new Map<TimelineEvent, number>(events.map((e) => [e, 1]));
	for (const kind of ["ends", "begins"] as const) {
		const groups = new Map<string, { date: string; reign: PageReign; orgs: Org[]; references: PageReference[] }>();
		for (const r of reigns) {
			const date = r[kind];
			if (!date || carried[kind].has(r) || bouts.some((b) => b.date === date && b.orgs.some((o) => o.abbreviation === r.org.abbreviation))) continue;
			const k = `${date}:${r.championId}`;
			if (!groups.has(k)) groups.set(k, { date, reign: r, orgs: [], references: [] });
			const g = groups.get(k)!;
			g.orgs.push(r.org);
			// the reign's sources for this day, once each
			for (const ref of r.references) if (nearerEnd(ref, r.begins, r.ends) === kind && !g.references.some((x) => x.url === ref.url)) g.references.push(ref);
		}
		for (const g of groups.values()) {
			const orgs = g.orgs.sort(byOrg);
			const names = listJoin(orgs.map((o) => o.short));
			const name: Part = { text: g.reign.name, href: `/champions/${g.reign.championId}/`, bold: true };
			const text =
				kind === "begins"
					? ` becomes ${the(names)} ${weightClass.toLowerCase()} world champion`
					: ` vacates ${the(names)} ${weightClass.toLowerCase()} world ${orgs.length === 1 ? "title" : "titles"}`;
			// a new champion away from a bout is labelled as one from a bout is, so every change of champion has the label
			const newChampion = kind === "begins" ? newChampionLabel(orgs, orgs) : null;
			const event: TimelineEvent = { date: g.date, parts: [name, { text }], orgs, gold: [], newChampion, scheduled: false, isBout: false, references: g.references };
			step.set(event, kind === "ends" ? 0 : 2);
			events.push(event);
		}
	}
	// the change comes first on its day, before the bout or new champion it is the context for
	for (const c of changes) {
		const event: TimelineEvent = { date: c.date, parts: wbaChangeParts(c), orgs: [c.to], gold: [], newChampion: null, scheduled: false, isBout: false, references: [] };
		step.set(event, -1);
		events.push(event);
	}
	return events.sort((a, b) => a.date.localeCompare(b.date) || step.get(a)! - step.get(b)!);
}

export type BarState = "held" | "begins" | "ends" | null;

// The timeline, a decade at a time: a heading row for each year, then a row per date, each with the state of every
// organisation's column of belt bars. The WBA's titles share a column; a world title passing straight from one
// champion to the next is still held. A year heading's bars carry on if a reign carries on past the date before it
export function timelineDecades(reigns: PageReign[], events: TimelineEvent[]) {
	const column = (org: string) => (org === "WBAS" || org === "WBAR" ? "WBA" : org);
	const columns = orgOrder.filter((org) => reigns.some((r) => column(r.org.abbreviation) === org));
	const belts = (date: string, heading: boolean): BarState[] =>
		columns.map((org) => {
			const states = reigns
				.filter((r) => column(r.org.abbreviation) === org && r.begins <= date && (!r.ends || (heading ? r.ends > date : r.ends >= date)))
				.map((r) => (heading ? "held" : r.begins === date ? "begins" : r.ends === date ? "ends" : "held"));
			if (states.length === 0) return null;
			return states.every((s) => s === "begins") ? "begins" : states.every((s) => s === "ends") ? "ends" : "held";
		});
	const dates = [...new Set(events.map((e) => e.date))];
	const decadeOf = (date: string) => `${date.slice(0, 3)}0`;
	const decades = [...new Set(dates.map(decadeOf))].map((decade) => {
		const shown = dates.filter((d) => decadeOf(d) === decade);
		const rows = [...new Set(shown.map((d) => d.slice(0, 4)))].flatMap((year) => {
			const inYear = shown.filter((d) => d.slice(0, 4) === year);
			const before = dates[dates.indexOf(inYear[0]) - 1];
			return [
				{ kind: "year" as const, label: year, date: "", belts: before ? belts(before, true) : columns.map(() => null), items: [] as TimelineEvent[] },
				...inYear.map((date) => ({
					kind: "date" as const,
					label: `${ordinal(dayjs(date).date())} ${dayjs(date).format("MMM")}`,
					date,
					belts: belts(date, false),
					items: events.filter((e) => e.date === date),
				})),
			];
		});
		return { decade, rows };
	});
	return { columns, decades };
}

// The reigns timeline (src/timeline): a lane per world title with its reign bars in the title's tint, named, and a
// circle for each world title bout, with its details on hover or tap
export const boutColour = "#2f6db3";

// a timeline lane: one world title, or the WBA's main line, which runs through the WBA and WBA Super world titles
export interface TimelineLane {
	org: Org;
	href: string | null;
	// the world titles the lane shows, when more than its own
	includes?: string[];
}

// The WBA's main line: the NBA's world title became the WBA's, which became WBA Super where the WBA split its champions
// in two, and the WBA again where it has one champion once more. One lane shows it all, as "WBA"; the WBA Regular world
// title, split off from it, keeps a lane of its own
export function mainLineLanes(orgs: Org[], weightClass: string): TimelineLane[] {
	const has = (abbreviation: string) => orgs.some((o) => o.abbreviation === abbreviation);
	if (!has("WBAS")) return orgs.map((o) => ({ org: o, href: titleHref(weightClass, o.abbreviation) }));
	const href = titleHref(weightClass, "WBA");
	const line: TimelineLane = { org: { abbreviation: "WBA", short: "WBA" }, href, includes: ["WBA", "WBAS"] };
	return [...orgs.filter((o) => o.abbreviation !== "WBA" && o.abbreviation !== "WBAS").map((o) => ({ org: o, href: titleHref(weightClass, o.abbreviation) })), line].sort(
		(a, b) => orgOrder.indexOf(a.org.abbreviation) - orgOrder.indexOf(b.org.abbreviation),
	);
}

// `contested` is false for a world title no longer contested: its timeline ends soon after its last reign or bout,
// rather than running on, empty, to today
export function reignsTimeline(lanes: TimelineLane[], reigns: PageReign[], bouts: PageBout[], today: string, forTitle: boolean, contested = true): Model {
	const first = Math.min(...reigns.map((r) => dayjs(r.begins).year()), ...bouts.map((b) => dayjs(b.date).year()));
	const ended = !contested && reigns.every((r) => r.ends);
	const last = [ended ? "" : today, ...reigns.map((r) => r.ends ?? today), ...bouts.map((b) => b.date)].sort().at(-1)!;
	const end = dayjs(last).add(2, "month").format("YYYY-MM-DD");
	const tint = (org: string) => `var(--color-${(tints[org] ?? "bg-wba-tint").slice(3)})`;
	const key = (scheduled: boolean, label: string) =>
		`<span><i aria-hidden="true" class="tl-key" style="background:${scheduled ? "var(--color-cream);border-style:dashed" : boutColour}"></i>${label}</span>`;
	const decades = Array.from({ length: Math.floor(dayjs(end).year() / 10) - Math.ceil(first / 10) + 1 }, (_, i) => (Math.ceil(first / 10) + i) * 10);
	return {
		full: [`${first}-01-01`, end],
		today,
		laneHeight: forTitle ? 56 : 40,
		labelWidth: 120,
		phoneLabelWidth: 96,
		heading: "",
		overviewYears: decades,
		// the NBA becoming the WBA, and, where the WBA's main line is one lane, each time its title became WBA Super or
		// the WBA title again
		markers: [
			...(lanes.some((l) => l.org.abbreviation === "WBA") && marksNbaToWba(reigns.map((r) => ({ org: r.org.abbreviation, begins: r.begins }))) ? [nbaToWba] : []),
			...(lanes.some((l) => l.includes?.includes("WBAS")) ? wbaChanges(reigns).map((c) => ({ date: c.date, label: wbaChangeLabel(c) })) : []),
		],
		legend: [key(false, "World title bout"), ...(bouts.some((b) => b.outcome === "scheduled") ? [key(true, "Scheduled")] : [])].join(""),
		lanes: lanes.map(({ org, href, includes = [org.abbreviation] }) => ({
			label: href ? `<a href="${href}" class="org whitespace-nowrap ${tints[org.abbreviation]}">${org.short}</a>` : `<span class="org whitespace-nowrap ${tints[org.abbreviation]}">${org.short}</span>`,
			bars: reigns
				.filter((r) => includes.includes(r.org.abbreviation))
				.map((r) => ({ start: r.begins, end: r.ends, background: tint(org.abbreviation), mini: "#a39e92", label: r.name })),
			dots: bouts
				.filter((b) => b.orgs.some((o) => includes.includes(o.abbreviation)))
				.map((b) => ({
					date: b.date,
					background: b.outcome === "scheduled" ? "var(--color-cream)" : boutColour,
					dashed: b.outcome === "scheduled",
					tip: { date: longDate(b.date), text: b.text, detail: `${b.outcome === "scheduled" ? "Scheduled · " : ""}${orgTagsHTML(b.orgs, b.gold)}` },
				})),
		})),
	};
}
