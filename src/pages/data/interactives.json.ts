// The data the interactives (Champion timeline comparison, Full timeline, Head to head) load in the browser, packed small: champions,
// reigns and world title bouts as arrays, with champions referred to by ID and dates as YYYY-MM-DD.
// Not part of the public API: its shape suits the interactives, and may change with them.
import type { APIRoute } from "astro";
import { getAllBouts, getAllChampions, getAllReigns } from "../../db";
import { isChampion, weightClasses } from "../../utils";
import { undisputedTitles } from "../../undisputed";

export const GET: APIRoute = async () => {
	const [champions, reigns, bouts] = await Promise.all([getAllChampions(), getAllReigns(), getAllBouts()]);
	const weights = weightClasses.map((wc) => wc.class);
	const w = (weightClass: string) => weights.indexOf(weightClass);
	// the world titles that made one of the boxers undisputed, at the titles' weight class
	const undisputed = (b: (typeof bouts)[number]) => {
		const ids = [b.boxers.boxerA, b.boxers.boxerB].filter(isChampion).map((x) => x.championId);
		const weight = b.titles[0]?.weight.class;
		if (!weight) return "";
		return undisputedTitles(ids, weight, b.date, b.titles.filter((t) => t.weight.class === weight).map((t) => t.org.name.abbreviation)).join(",");
	};
	const data = {
		weights,
		// [id, name, born]
		champions: champions.map((c) => [c.championId, `${c.name.first} ${c.name.last}`, c.born]),
		// [champion id, org, weight index, begins, ends ("" while it carries on)]
		reigns: reigns.map((r) => [r.champion.championId, r.title.org.name.abbreviation, w(r.title.weight.class), r.period.begins, r.period.ends ?? ""]),
		// [date, boxer A, boxer B, result, method, rounds, bout weight index, [[org, title weight index], …], undisputed]; a
		// boxer is a champion's id, or the name of a boxer who never won a world title. Result: A, B, D (draw), N (no
		// contest), S (scheduled). Undisputed: the orgs to highlight in gold, comma separated, as on the site's other pages
		bouts: bouts.map((b) => [
			b.date,
			isChampion(b.boxers.boxerA) ? b.boxers.boxerA.championId : b.boxers.boxerA.name,
			isChampion(b.boxers.boxerB) ? b.boxers.boxerB.championId : b.boxers.boxerB.name,
			b.status === "SCHEDULED"
				? "S"
				: b.result.winner === "BOXER A"
					? "A"
					: b.result.winner === "BOXER B"
						? "B"
						: b.result.winner === "DRAW"
							? "D"
							: "N",
			b.result.methodOfVictory ?? "",
			b.result.totalRounds ? `${b.result.totalRounds}/${b.scheduledRounds}` : "",
			w(b.weight.class),
			b.titles.map((t) => [t.org.name.abbreviation, w(t.weight.class)]),
			undisputed(b),
		]),
	};
	return new Response(JSON.stringify(data));
};
