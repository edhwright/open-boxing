// Checks the CSVs' values when the site builds: every row against its file's schema (dates, ids, world titles,
// results and so on). Any problem stops the build, with every problem listed by file and row, so a typo in the data
// never reaches the site. Only the values' types and formats are checked here, not how the rows fit together (e.g. a
// reign ending before it begins).
import { z } from "zod";
import { csvParse } from "d3-dsv";
import { WEIGHT_CLASSES, WeightClassEnum } from "./types";

// a real date as YYYY-MM-DD: 1991-02-30 has the right format but isn't a day
const isDay = (s: string) => {
	const d = new Date(`${s}T00:00:00Z`);
	return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
export const date = z
	.string()
	// a date in the wrong format is only reported as that
	.regex(/^\d{4}-\d{2}-\d{2}$/, { message: "should be a date as YYYY-MM-DD", abort: true })
	.refine(isDay, "isn't a real date");
export const optionalDate = z.union([z.literal(""), date]);
export const id = z.string().regex(/^\d+$/, "should be a whole number");
export const optionalId = z.union([z.literal(""), id]);

export const ORGS = ["IBU", "NYSAC", "WBA", "WBAS", "WBAR", "WBC", "IBF", "WBO", "RING"] as const;
export const org = z.enum(ORGS);
// a weight limit in pounds, "+" for no upper limit, e.g. "147" or "200+"
export const pounds = z.string().regex(/^\d+\+?$/, 'should be a weight in pounds, e.g. "147" or "200+"');
// a world title as reigns.csv and bouts.csv name it: "ORG-Weight Class-lb", e.g. "WBC-Heavyweight-200+"
const titlePattern = `(${ORGS.join("|")})-(${WEIGHT_CLASSES.join("|")})-\\d+\\+?`;
export const title = z.string().regex(new RegExp(`^${titlePattern}$`), 'should be a world title as "ORG-Weight Class-lb", e.g. "WBC-Heavyweight-200+"');
export const titles = z.string().regex(new RegExp(`^${titlePattern}(,${titlePattern})*$`), 'should be world titles as "ORG-Weight Class-lb", separated by commas');
export const orgList = z.string().regex(new RegExp(`^(${ORGS.join("|")})(,(${ORGS.join("|")}))*$`), "should be organisations separated by commas, e.g. WBA,WBC");
export const weightClass = WeightClassEnum;
export const link = z.string().regex(/^https?:\/\//, "should be a web address starting https://");

// the problems found so far, across every file checked
const problems: string[] = [];

// every row of a CSV, checked against its schema. Problems are collected, so that every file can be checked before
// assertValid() stops the build with all of them
export function parseCSV<T extends z.ZodType>(file: string, text: string, schema: T): z.infer<T>[] {
	const rows = csvParse(text);
	const parsed = rows.map((row, i) => {
		const result = schema.safeParse(row);
		if (result.success) return result.data;
		for (const issue of result.error.issues) {
			const column = String(issue.path[0] ?? "");
			const value = row[column];
			// row 1 is the header, so the first row of data is row 2
			problems.push(`${file}, row ${i + 2}, ${column}: ${value === undefined ? "missing" : `"${value}" ${issue.message}`}`);
		}
		return undefined;
	});
	return parsed.filter((row) => row !== undefined) as z.infer<T>[];
}

// stops the build if any file checked so far has a problem, listing every one
export function assertValid() {
	if (problems.length) {
		const shown = problems.slice(0, 50);
		throw new Error(`The data has ${problems.length} ${problems.length === 1 ? "problem" : "problems"}:\n${shown.join("\n")}${problems.length > shown.length ? `\n…and ${problems.length - shown.length} more` : ""}`);
	}
}
