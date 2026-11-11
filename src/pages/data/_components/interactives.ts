// What the two interactives share in the browser: loading /data/interactives.json into easy shapes, describing
// bouts and dates, and keeping the chosen boxers and world titles in the page's address so a view can be shared.

export interface Boxer {
	id: number;
	name: string;
	born: string;
	// the years of their first and last world title reigns; last is null while a reign carries on
	first: number;
	last: number | null;
}

export interface Reign {
	id: number;
	championId: number;
	org: string;
	weight: string;
	begins: string;
	ends: string | null;
}

// a side of a bout: a champion (with their id) or a boxer who never won a world title
export interface Side {
	id: number | null;
	name: string;
}

export interface Bout {
	id: number;
	date: string;
	a: Side;
	b: Side;
	result: "A" | "B" | "D" | "N" | "S";
	method: string;
	rounds: string;
	weight: string;
	titles: { org: string; weight: string }[];
	// the world titles that made one of the boxers undisputed, highlighted in gold
	gold: string[];
}

// a boxer or world title the picker can add
export interface Option {
	key: string;
	label: string;
	// a world title's org, so its chip and suggestion take its tint
	org?: string;
	// a boxer's colour on a chart, shown on their chip
	swatch?: string;
}

export interface Data {
	boxers: Boxer[];
	boxerById: Map<number, Boxer>;
	reigns: Reign[];
	bouts: Bout[];
	// every world title, as "ORG:Weight class"
	titles: { org: string; weight: string }[];
}

export async function load(): Promise<Data> {
	const raw = await fetch("/data/interactives.json").then((response) => response.json());
	const weights: string[] = raw.weights;
	const reigns: Reign[] = raw.reigns.map(([championId, org, w, begins, ends]: [number, string, number, string, string], id: number) => ({
		id,
		championId,
		org,
		weight: weights[w],
		begins,
		ends: ends || null,
	}));
	const names = new Map<number, string>(raw.champions.map(([id, name]: [number, string]) => [id, name]));
	const side = (x: number | string): Side => (typeof x === "number" ? { id: x, name: names.get(x) ?? "" } : { id: null, name: x });
	const bouts: Bout[] = raw.bouts.map(([date, a, b, result, method, rounds, w, titles, gold]: [string, number | string, number | string, Bout["result"], string, string, number, [string, number][], string], id: number) => ({
		id,
		date,
		a: side(a),
		b: side(b),
		result,
		method,
		rounds,
		weight: weights[w],
		titles: titles.map(([org, tw]) => ({ org, weight: weights[tw] })),
		gold: gold ? gold.split(",") : [],
	}));
	const boxers: Boxer[] = raw.champions.map(([id, name, born]: [number, string, string]) => {
		const own = reigns.filter((r) => r.championId === id);
		const years = own.map((r) => Number(r.begins.slice(0, 4)));
		return {
			id,
			name,
			born,
			first: Math.min(...years),
			last: own.some((r) => !r.ends) ? null : Math.max(...own.map((r) => Number((r.ends as string).slice(0, 4)))),
		};
	});
	const titles = [...new Map(reigns.map((r) => [`${r.org}:${r.weight}`, { org: r.org, weight: r.weight }])).values()].sort(
		(a, b) => weights.indexOf(a.weight) - weights.indexOf(b.weight) || orgOrder.indexOf(a.org) - orgOrder.indexOf(b.org),
	);
	return { boxers, boxerById: new Map(boxers.map((b) => [b.id, b])), reigns, bouts, titles };
}

export const orgOrder = ["IBU", "NYSAC", "WBA", "WBAS", "WBAR", "WBC", "IBF", "WBO", "RING"];

// The timelines' lanes: a world title each, except the WBA's main line. The WBA world title became WBA Super where the
// WBA split its champions in two, and is the WBA again where it has one champion once more, so one lane, "WBA", shows
// both; the WBA Regular world title, split off from it, keeps its own
export interface TitleLane {
	org: string;
	weight: string;
	// the world titles it shows
	includes: string[];
	// its world title page (WBA Super's is the WBA's)
	href: string;
}
export const laneOrg = (org: string) => (org === "WBAS" ? "WBA" : org);
export function titleLanes(titles: { org: string; weight: string }[]): TitleLane[] {
	const slug = (s: string) => s.replaceAll(" ", "-").toLowerCase();
	const lanes = new Map<string, TitleLane>();
	for (const t of titles) {
		const key = `${laneOrg(t.org)}:${t.weight}`;
		const lane = lanes.get(key) ?? { org: laneOrg(t.org), weight: t.weight, includes: [], href: "" };
		lane.includes.push(t.org);
		lane.href = `/${slug(t.weight)}/${slug(lane.org)}/`;
		lanes.set(key, lane);
	}
	return [...lanes.values()];
}

// a WBA lane's marks for each time its weight class's WBA world title became WBA Super, or WBA Super became the WBA title
export function wbaSuperMarks(lane: TitleLane, reigns: Reign[]) {
	if (!lane.includes.includes("WBAS")) return [];
	const line = reigns.filter((r) => (r.org === "WBA" || r.org === "WBAS") && r.weight === lane.weight).sort((a, b) => a.begins.localeCompare(b.begins));
	return line.slice(1).flatMap((r, i) => {
		if (r.org === line[i].org) return [];
		const label = r.org === "WBAS" ? "The WBA title becomes WBA Super" : "WBA Super becomes the WBA title";
		return [{ date: r.begins, label, tip: { date: longDate(r.begins), text: label, detail: lane.weight } }];
	});
}
export const orgNames: Record<string, string> = { WBAS: "WBA Super", WBAR: "WBA Regular", RING: "The Ring" };
export const orgName = (org: string) => orgNames[org] ?? org;
export const titleName = (t: { org: string; weight: string }) => `${orgName(t.org)} ${t.weight.toLowerCase()}`;

export const methods: Record<string, string> = {
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

export const winnerOf = (b: Bout) => (b.result === "A" ? b.a : b.result === "B" ? b.b : null);
export const loserOf = (b: Bout) => (b.result === "A" ? b.b : b.result === "B" ? b.a : null);
// "Muhammad Ali beats George Foreman via knockout 8/15"
export function boutText(b: Bout) {
	const how = [b.method && b.method !== "NC" ? `via ${methods[b.method] ?? b.method}` : "", b.rounds].filter(Boolean).join(" ");
	const w = winnerOf(b);
	const l = loserOf(b);
	if (w && l) return `${w.name} beats ${l.name}${how ? ` ${how}` : ""}`;
	if (b.result === "D") return `${b.a.name} and ${b.b.name} draw${how ? ` ${how}` : ""}`;
	if (b.result === "N") return `${b.a.name} v ${b.b.name} ends in a no contest`;
	return `${b.a.name} v ${b.b.name}`;
}

export const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// "4th Jul 1923"
export const longDate = (iso: string) => {
	const [y, m, d] = iso.split("-").map(Number);
	return `${ordinal(d)} ${months[m - 1]} ${y}`;
};
// "4th July 1923"
export const fullDate = (iso: string) => {
	const [y, m, d] = iso.split("-").map(Number);
	return `${ordinal(d)} ${fullMonths[m - 1]} ${y}`;
};
export const ageOn = (born: string, iso: string) => {
	const [by, bm, bd] = born.split("-").map(Number);
	const [y, m, d] = iso.split("-").map(Number);
	return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
};
export const today = () => new Date().toISOString().slice(0, 10);
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
export const listJoin = (names: string[]) => (names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

// champions' ids by name, for an interactive's starting choices (ids can change when the data is rebuilt)
export const idsByName = (data: Data, names: string[]) => names.flatMap((name) => data.boxers.filter((b) => b.name === name).map((b) => b.id));

// The page's address keeps what is chosen, e.g. ?show=252,269,WBC:Heavyweight&by=age, so a view can be shared.
export function readAddress(name: string, fallback: string[]): string[] {
	const value = new URLSearchParams(location.search).get(name);
	return value === null ? fallback : value.split(",").filter(Boolean);
}
export function writeAddress(values: Record<string, string | null>) {
	const params = new URLSearchParams(location.search);
	for (const [name, value] of Object.entries(values)) {
		if (value === null) params.delete(name);
		else params.set(name, value);
	}
	const query = params.toString().replaceAll("%2C", ",").replaceAll("%3A", ":").replaceAll("+", "%20");
	history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
}
