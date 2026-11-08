// The undisputed champions, from data/undisputed-periods.csv (written by content/scripts/undisputed.py, by the rule in
// content/data/undisputed.csv). Server only: it reads the data at build time.
import undisputedCSV from "../data/undisputed-periods.csv?raw";
import { z } from "zod";
import { assertValid, date, id, optionalDate, orgList, parseCSV, weightClass } from "./db/validate";

const PeriodRow = z.object({
	champion_id: id,
	name: z.string(),
	weight_class: weightClass,
	begins: date,
	ends: optionalDate,
	// the titles that counted, e.g. "WBA,WBC,IBF,WBO"
	titles: orgList,
});

const periods = parseCSV("undisputed-periods.csv", undisputedCSV, PeriodRow).map((r) => ({
	championId: Number(r.champion_id),
	weightClass: r.weight_class as string,
	begins: r.begins,
	ends: r.ends || null,
	titles: r.titles.split(","),
}));
assertValid();

// The titles to highlight in gold for a bout or world title change: those that made one of its boxers undisputed at
// that weight class on that day, when every one of them is involved. Otherwise none. A period includes the day it
// begins (won) and the day it ends (lost or given up).
export function undisputedTitles(championIds: number[], weightClass: string, date: string, orgs: string[]): string[] {
	const period = periods.find(
		(p) => championIds.includes(p.championId) && p.weightClass === weightClass && p.begins <= date && (p.ends === null || date <= p.ends),
	);
	if (!period || period.titles.length < 2 || !period.titles.every((t) => orgs.includes(t))) return [];
	return period.titles;
}

// the titles of the undisputed champion at a weight class now, if there is one
export function undisputedNow(weightClass: string): string[] {
	return periods.find((p) => p.weightClass === weightClass && p.ends === null)?.titles ?? [];
}
