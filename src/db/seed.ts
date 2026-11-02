import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import championsCSV from "../../data/champions.csv?raw";
import locationsCSV from "../../data/locations.csv?raw";
import reignsCSV from "../../data/reigns.csv?raw";
import boutsCSV from "../../data/bouts.csv?raw";
import titlesCSV from "../../data/titles.csv?raw";
import referencesCSV from "../../data/references.csv?raw";
import { z } from "zod";
import { csvParse } from "d3-dsv";
import { WeightClassEnum } from "./types";
import * as schema from "./schema";
import { Bout, BoutTitle, Title, Location, Champion, Reign, Reference } from "./schema";

const id = z.string().regex(/^\d+$/, "id must be numeric");
const optionalId = z.union([z.literal(""), z.string().regex(/^\d+$/)]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid date format (YYYY-MM-DD)");
const optionalDate = z.union([z.literal(""), date]);

// SQLite caps the number of bound parameters per statement, so insert in batches
async function insertAll<T extends SQLiteTable>(db: SqliteRemoteDatabase<typeof schema>, table: T, rows: T["$inferInsert"][]) {
	for (let i = 0; i < rows.length; i += 500) {
		await db.insert(table).values(rows.slice(i, i + 500));
	}
}

export default async function seed(db: SqliteRemoteDatabase<typeof schema>) {
	// Champions table
	const ChampionRow = z.object({
		champion_id: id,
		first_name: z.string(),
		last_name: z.string(),
		short_name: z.string(),
		born: date,
	});

	const championRows = csvParse(championsCSV).map((r) => ChampionRow.parse(r));

	await insertAll(
		db,
		Champion,
		championRows.map((r) => ({
			champion_id: Number(r.champion_id),
			first_name: r.first_name,
			last_name: r.last_name,
			short_name: r.short_name,
			born: r.born,
		})),
	);

	// Titles table
	const TitleRow = z.object({
		title_id: id,
		org_full_name: z.string(),
		org_short_name: z.string(),
		org_abbreviation: z.string(),
		active: z.enum(["0", "1"]),
		weight_class: WeightClassEnum,
		latest_weight_lb: z.string(),
	});

	const titleRows = csvParse(titlesCSV).map((r) => TitleRow.parse(r));

	await insertAll(
		db,
		Title,
		titleRows.map((r) => ({
			title_id: Number(r.title_id),
			org_full_name: r.org_full_name,
			org_short_name: r.org_short_name,
			org_abbreviation: r.org_abbreviation,
			active: r.active === "1",
			weight_class: r.weight_class,
			latest_weight_lb: r.latest_weight_lb,
		})),
	);

	// reigns.csv and bouts.csv refer to titles as "ORG-Weight Class-lb", e.g. "WBC-Heavyweight-200+"
	const titleIdByOrgAndWeightClass = new Map(titleRows.map((t) => [`${t.org_abbreviation}-${t.weight_class}`, Number(t.title_id)]));

	function parseTitleString(titleString: string) {
		const [orgAbbreviation, weightClass, weightLb] = titleString.split("-");
		const titleId = titleIdByOrgAndWeightClass.get(`${orgAbbreviation}-${weightClass}`);
		if (titleId === undefined) throw new Error(`Title not found for ${orgAbbreviation}-${weightClass}`);
		return { title_id: titleId, weight_lb: weightLb };
	}

	// Location table
	const LocationRow = z.object({
		location_id: id,
		latest_venue_name: z.string(),
		locality: z.string(),
		country: z.string(),
		latitude: z.string().regex(/^-?\d+(\.\d+)?$/, "must be a valid number"),
		longitude: z.string().regex(/^-?\d+(\.\d+)?$/, "must be a valid number"),
	});

	const locationRows = csvParse(locationsCSV).map((r) => LocationRow.parse(r));

	await insertAll(
		db,
		Location,
		locationRows.map((r) => ({
			location_id: Number(r.location_id),
			latest_venue_name: r.latest_venue_name,
			locality: r.locality,
			country: r.country,
			latitude: Number(r.latitude),
			longitude: Number(r.longitude),
		})),
	);

	// Reigns table
	const ReignRow = z.object({
		reign_id: id,
		begins: date,
		ends: optionalDate,
		champion_id: id,
		name: z.string(),
		current: z.enum(["0", "1"]),
		title: z.string(),
	});

	const reignRows = csvParse(reignsCSV).map((r) => ReignRow.parse(r));

	await insertAll(
		db,
		Reign,
		reignRows.map((r) => ({
			reign_id: Number(r.reign_id),
			begins: r.begins,
			ends: r.ends === "" ? null : r.ends,
			champion_id: Number(r.champion_id),
			name: r.name,
			is_current_champion: r.current === "1",
			...parseTitleString(r.title),
		})),
	);

	// Bouts table
	const BoutRow = z.object({
		bout_id: id,
		date: date,
		boxer_a_champion_id: optionalId,
		boxer_a_name: z.string(),
		boxer_b_champion_id: optionalId,
		boxer_b_name: z.string(),
		status: z.enum(["SCHEDULED", "FINISHED"]),
		winner: z.enum(["BOXER A", "BOXER B", "DRAW", "NO CONTEST", ""]),
		method_of_victory: z.string(),
		total_rounds: optionalId,
		scheduled_rounds: z.string().regex(/^\d+$/, "scheduled rounds must be numeric"),
		weight_class: WeightClassEnum,
		weight_lb: z.string(),
		titles: z.string(),
		location_id: optionalId,
		location_venue: z.string(),
	});

	const boutRows = csvParse(boutsCSV).map((r) => BoutRow.parse(r));

	await insertAll(
		db,
		Bout,
		boutRows.map((r) => ({
			bout_id: Number(r.bout_id),
			date: r.date,
			boxer_a_id: r.boxer_a_champion_id === "" ? null : Number(r.boxer_a_champion_id),
			boxer_a_name: r.boxer_a_name,
			boxer_b_id: r.boxer_b_champion_id === "" ? null : Number(r.boxer_b_champion_id),
			boxer_b_name: r.boxer_b_name,
			status: r.status,
			winner: r.winner === "" ? null : r.winner,
			method_of_victory: r.method_of_victory === "" ? null : r.method_of_victory,
			total_rounds: r.total_rounds === "" ? null : Number(r.total_rounds),
			scheduled_rounds: Number(r.scheduled_rounds),
			weight_class: r.weight_class,
			weight_lb: r.weight_lb,
			location_id: r.location_id === "" ? null : Number(r.location_id),
			location_venue: r.location_venue === "" ? null : r.location_venue,
		})),
	);

	await insertAll(
		db,
		BoutTitle,
		boutRows.flatMap((r) =>
			r.titles.split(",").map((t, position) => ({
				bout_id: Number(r.bout_id),
				...parseTitleString(t),
				position: position,
			})),
		),
	);

	// References table
	const ReferenceRow = z.object({
		reference_id: id,
		headline: z.string(),
		author: z.string(),
		publication: z.string(),
		publication_date: date,
		bout_id: optionalId,
		reign_id: optionalId,
		event_date: date,
		link_text: z.string(),
		link_url: z.string(),
	});

	const referenceRows = csvParse(referencesCSV).map((r) => ReferenceRow.parse(r));

	await insertAll(
		db,
		Reference,
		referenceRows.map((r) => ({
			reference_id: Number(r.reference_id),
			headline: r.headline,
			author: r.author === "" ? null : r.author,
			publication: r.publication,
			publication_date: r.publication_date,
			bout_id: r.bout_id === "" ? null : Number(r.bout_id),
			reign_id: r.reign_id === "" ? null : Number(r.reign_id),
			event_date: r.event_date,
			link_text: r.link_text,
			link: r.link_url,
		})),
	);
}
