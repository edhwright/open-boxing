import { csvParse } from "d3-dsv";
import { group } from "d3-array";
import Database from "better-sqlite3";
import championsCSV from "./data/champions.csv?raw";
import locationsCSV from "./data/locations.csv?raw";
import reignsCSV from "./data/reigns.csv?raw";
import boutsCSV from "./data/bouts.csv?raw";
import titlesCSV from "./data/titles.csv?raw";
import referencesCSV from "./data/references.csv?raw";
import { processChampionResult, processTitleResult, processReignResult, processBoutResult, processReferenceResult } from "./utils";
import type {
	ChampionInsert,
	ChampionResult,
	TitleInsert,
	TitleResult,
	ReignInsert,
	ReignResult,
	LocationInsert,
	BoutInsert,
	BoutResult,
	ReferenceInsert,
	ReferenceResult,
} from "./types";

//////////////// creates temporary database ////////////////
const db = new Database("", { verbose: console.log });

//////////////// insert champions ////////////////
const champions = csvParse(championsCSV).map((c) => ({
	...c,
	champion_id: parseInt(c.champion_id as string),
})) as ChampionInsert[];

db.prepare("CREATE TABLE champions (champion_id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, short_name TEXT, born TEXT)").run();
const insertChampion = db.prepare(
	"INSERT INTO champions (champion_id, first_name, last_name, short_name, born) VALUES (@champion_id, @first_name, @last_name, @short_name, @born)"
);
for (const champion of champions) insertChampion.run(champion);

//////////////// insert titles ////////////////
const titles = csvParse(titlesCSV).map((t) => ({
	...t,
	title_id: parseInt(t.title_id as string),
	active: parseInt(t.active as string),
})) as TitleInsert[];

db.prepare(
	"CREATE TABLE titles (title_id INTEGER PRIMARY KEY, org_full_name TEXT, org_short_name TEXT, org_abbreviation TEXT, active INTEGER, weight_class TEXT, weight_lb TEXT)"
).run();

const insertTitle = db.prepare(
	"INSERT INTO titles (title_id, org_full_name, org_short_name, org_abbreviation, active, weight_class, weight_lb) VALUES (@title_id, @org_full_name, @org_short_name, @org_abbreviation, @active, @weight_class, @weight_lb)"
);
for (const title of titles) insertTitle.run(title);

//////////////// insert reigns ////////////////
const reigns = csvParse(reignsCSV).map((r) => ({
	...r,
	reign_id: parseInt(r.reign_id as string),
	ends: r.ends === "" ? null : r.ends,
	champion_id: parseInt(r.champion_id as string),
	current: parseInt(r.current as string),
})) as ReignInsert[];

db.prepare(
	"CREATE TABLE reigns (reign_id INTEGER PRIMARY KEY, begins TEXT, ends TEXT, champion_id INTEGER, name TEXT, current INTEGER, title TEXT, FOREIGN KEY(champion_id) REFERENCES champions(champion_id))"
).run();
const insertReign = db.prepare(
	"INSERT INTO reigns (reign_id, begins, ends, champion_id, name, current, title) VALUES (@reign_id, @begins, @ends, @champion_id, @name, @current, @title)"
);
for (const reign of reigns) insertReign.run(reign);

//////////////// insert locations ////////////////
const locations = csvParse(locationsCSV).map((l) => ({
	...l,
	location_id: parseInt(l.location_id as string),
	latitude: parseFloat(l.latitude as string),
	longitude: parseFloat(l.longitude as string),
})) as LocationInsert[];

db.prepare("CREATE TABLE locations (location_id INTEGER PRIMARY KEY, venue TEXT, locality TEXT, country TEXT, latitude REAL, longitude REAL)").run();
const insertLocation = db.prepare(
	"INSERT INTO locations (location_id, venue, locality, country, latitude, longitude) VALUES (@location_id, @venue, @locality, @country, @latitude, @longitude)"
);
for (const location of locations) insertLocation.run(location);

//////////////// insert bouts ////////////////
const bouts = csvParse(boutsCSV).map((b) => {
	if (!(b.status === "FINISHED" || b.status === "SCHEDULED")) {
		throw new Error(`status must be "FINISHED" or "SCHEDULED"`);
	}

	if (!(b.winner === "BOXER A" || b.winner === "BOXER B" || b.winner === "DRAW" || b.winner === "NO CONTEST" || b.winner === "")) {
		throw new Error(`winner must be "BOXER A", "BOXER B", "DRAW", "NO CONTEST" or ""`);
	}

	return {
		...b,
		bout_id: parseInt(b.bout_id as string),
		boxer_a_champion_id: b.boxer_a_champion_id === "" ? null : parseInt(b.boxer_a_champion_id as string),
		boxer_b_champion_id: b.boxer_b_champion_id === "" ? null : parseInt(b.boxer_b_champion_id as string),
		winner: b.winner === "" ? null : b.winner,
		method_of_victory: b.method_of_victory === "" ? null : b.method_of_victory,
		total_rounds: b.total_rounds === "" ? null : parseInt(b.total_rounds as string),
		scheduled_rounds: parseInt(b.scheduled_rounds as string),
		location_id: b.location_id === "" ? null : parseInt(b.location_id as string),
	};
}) as BoutInsert[];

db.prepare(
	"CREATE TABLE bouts (bout_id INTEGER PRIMARY KEY, date TEXT, boxer_a_name TEXT, boxer_a_champion_id INTEGER, boxer_b_name TEXT, boxer_b_champion_id INTEGER, status TEXT, winner TEXT, method_of_victory TEXT, total_rounds INTEGER, scheduled_rounds INTEGER, weight_class TEXT, weight_lb TEXT, titles TEXT, location_id INTEGER, FOREIGN KEY(boxer_a_champion_id) REFERENCES champions(champion_id), FOREIGN KEY(boxer_b_champion_id) REFERENCES champions(champion_id), FOREIGN KEY(location_id) REFERENCES locations(location_id))"
).run();
const insertBout = db.prepare(
	"INSERT INTO bouts (bout_id, date, boxer_a_name, boxer_a_champion_id, boxer_b_name, boxer_b_champion_id, status, winner, method_of_victory, total_rounds, scheduled_rounds, weight_class, weight_lb, titles, location_id) VALUES (@bout_id, @date, @boxer_a_name, @boxer_a_champion_id, @boxer_b_name, @boxer_b_champion_id, @status, @winner, @method_of_victory, @total_rounds, @scheduled_rounds, @weight_class, @weight_lb, @titles, @location_id)"
);
for (const bout of bouts) insertBout.run(bout);

//////////////// insert references ////////////////
const references = csvParse(referencesCSV).map((r) => ({
	...r,
	reference_id: parseInt(r.reference_id as string),
	bout_id: r.bout_id === "" ? null : parseInt(r.bout_id as string),
	reign_id: r.reign_id === "" ? null : parseInt(r.reign_id as string),
})) as ReferenceInsert[];

// references is a sqlite keyword, so refs is used as table name
db.prepare(
	"CREATE TABLE refs (reference_id INTEGER PRIMARY KEY, title TEXT, author TEXT, publication TEXT, publication_date TEXT, bout_id INTEGER, reign_id INTEGER, link_text TEXT, link_url TEXT, FOREIGN KEY(bout_id) REFERENCES bouts(bout_id), FOREIGN KEY(reign_id) REFERENCES reigns(reign_id))"
).run();

const insertReference = db.prepare(
	"INSERT INTO refs (reference_id, title, author, publication, publication_date, bout_id, reign_id, link_text, link_url) VALUES (@reference_id, @title, @author, @publication, @publication_date, @bout_id, @reign_id, @link_text, @link_url)"
);
for (const reference of references) insertReference.run(reference);

//////////////// query db ////////////////
function getChampions(filter: string | null) {
	const sql = `
        SELECT * from champions
        ${filter ? filter : ""}
    `;
	const statement = db.prepare(sql);
	const records = statement.all() as ChampionResult[];
	if (records.length === 0) return [];
	const processedRecords = records.map(processChampionResult);
	return processedRecords;
}

export function getAllChampions() {
	const allChampions = getChampions(`ORDER BY champion_id ASC`);
	return allChampions;
}

export function getChampion(championId: number) {
	const bout = getChampions(`WHERE champion_id = ${championId} LIMIT 1`)[0];
	return bout;
}

function getTitles(filter: string | null) {
	const sql = `
        SELECT * from titles
        ${filter ? filter : ""}
    `;
	const statement = db.prepare(sql);
	const records = statement.all() as TitleResult[];
	if (records.length === 0) return [];
	const processedRecords = records.map(processTitleResult);
	return processedRecords;
}

export function getAllTitles() {
	const allTitles = getTitles(`ORDER BY title_id ASC`);
	return allTitles;
}

export const titleByTitleString = new Map(getAllTitles().map((title) => [`${title.org.name.abbreviation}-${title.weight.class}`, title]));

function getReigns(filter: string | null) {
	const sql = `
        SELECT r.reign_id, r.begins, r.ends, c.champion_id, c.first_name, c.last_name, c.short_name, c.born, r.current, r.title
        FROM reigns r
        LEFT JOIN champions c ON r.champion_id = c.champion_id
        ${filter ? filter : ""}
    `;
	const statement = db.prepare(sql);
	const records = statement.all() as ReignResult[];
	if (records.length === 0) return [];
	const processedRecords = records.map(processReignResult);
	return processedRecords;
}

export function getAllReigns() {
	return getReigns(`ORDER BY r.begins ASC`);
}

export function getTitleReigns(weightClass: string, orgAbbreviation: string) {
	const titleReigns = getReigns(`WHERE r.title LIKE '%${orgAbbreviation}-${weightClass.replaceAll("-", " ")}%' COLLATE NOCASE ORDER BY r.begins ASC`);
	return titleReigns;
}

export function getWeightClassReigns(weightClass: string) {
	const weightClassReigns = getReigns(`WHERE r.title LIKE '%-${weightClass.replaceAll("-", " ")}-%' COLLATE NOCASE ORDER BY r.begins ASC`);
	return weightClassReigns;
}

export function getChampionReigns(championId: number) {
	const championReigns = getReigns(`WHERE c.champion_id IS ${championId} ORDER BY r.begins ASC`);
	return championReigns;
}

export function getLatestTitleReign(weightClass: string, orgAbbreviation: string) {
	const latestTitleReigns = getReigns(`WHERE r.title LIKE '%${orgAbbreviation}-${weightClass}%' ORDER BY r.begins DESC LIMIT 1`);
	if (latestTitleReigns.length === 0) {
		return null;
	} else {
		return latestTitleReigns[0];
	}
}

export function getLatestReigns(limit: number) {
	const latestReigns = getReigns(`ORDER BY r.begins DESC LIMIT ${limit}`);
	return latestReigns;
}

function getBouts(filter: string | null) {
	const sql = `
        SELECT b.bout_id, b.date, b.boxer_a_name as a_default_name, ca.champion_id as a_champion_id, ca.first_name as a_first_name, ca.last_name as a_last_name, ca.short_name as a_short_name, ca.born as a_born, b.boxer_b_name as b_default_name, cb.champion_id as b_champion_id, cb.first_name as b_first_name, cb.last_name as b_last_name, cb.short_name as b_short_name, cb.born as b_born, b.status, b.winner, b.method_of_victory, b.total_rounds, b.scheduled_rounds, b.weight_class, b.weight_lb, b.titles, l.location_id, l.venue, l.locality, l.country, l.latitude, l.longitude  
        FROM bouts b 
        LEFT JOIN champions ca ON b.boxer_a_champion_id = ca.champion_id
        LEFT JOIN champions cb ON b.boxer_b_champion_id = cb.champion_id
        LEFT JOIN locations l ON b.location_id = l.location_id
        ${filter ? filter : ""}
    `;
	const statement = db.prepare(sql);
	const records = statement.all() as BoutResult[];
	if (records.length === 0) return [];
	const processedRecords = records.map(processBoutResult);
	return processedRecords;
}

export function getAllBouts() {
	return getBouts(`ORDER BY b.date ASC`);
}

export function getScheduledBouts() {
	const scheduledBouts = getBouts(`WHERE b.status = 'SCHEDULED' ORDER BY b.date ASC`);
	return scheduledBouts;
}

export function getBout(boutId: number) {
	const bout = getBouts(`WHERE b.bout_id = ${boutId} LIMIT 1`)[0];
	return bout;
}

// can consume both ("Light Heavyweight", "NYSAC") and ("light-heavyweight", "nysac")
export function getTitleBouts(weightClass: string, orgAbbreviation: string) {
	const titleBouts = getBouts(`WHERE b.titles LIKE '%${orgAbbreviation}-${weightClass.replaceAll("-", " ")}%' COLLATE NOCASE ORDER BY b.date ASC`);
	return titleBouts;
}

export function getScheduledTitleBouts(weightClass: string, orgAbbreviation: string) {
	const scheduledTitleBouts = getBouts(
		`WHERE b.status = 'SCHEDULED' AND b.titles LIKE '%${orgAbbreviation}-${weightClass.replaceAll("-", " ")}%' COLLATE NOCASE ORDER BY b.date ASC`
	);
	return scheduledTitleBouts;
}

export function getWeightClassBouts(weightClass: string) {
	const weightClassBouts = getBouts(`WHERE b.titles LIKE '%-${weightClass.replaceAll("-", " ")}-%' COLLATE NOCASE ORDER BY b.date ASC`);
	return weightClassBouts;
}

export function getScheduledWeightClassBouts(weightClass: string) {
	const scheduledWeightClassBouts = getBouts(`WHERE b.status = 'SCHEDULED' AND b.titles LIKE '%-${weightClass.replaceAll("-", " ")}-%' COLLATE NOCASE ORDER BY b.date ASC`);
	return scheduledWeightClassBouts;
}

export function getNextScheduledWeightClassBout(weightClass: string) {
	const nextScheduledWeightClassBouts = getBouts(`WHERE b.status = 'SCHEDULED' AND b.titles LIKE '%-${weightClass.replaceAll("-", " ")}-%' COLLATE NOCASE ORDER BY b.date ASC`);
	return nextScheduledWeightClassBouts[0];
}

export function getChampionBouts(championId: number) {
	const championBouts = getBouts(`WHERE ca.champion_id IS ${championId} OR cb.champion_id IS ${championId} ORDER BY b.date ASC`);
	return championBouts;
}

export function getReferences(filter: string | null) {
	const sql = `
        SELECT * from refs
        ${filter ? filter : ""}
    `;
	const statement = db.prepare(sql);
	const records = statement.all() as ReferenceResult[];
	if (records.length === 0) return [];
	const processedRecords = records.map(processReferenceResult);
	return processedRecords;
}

export const referencesByBoutId = group(getReferences(`WHERE bout_id IS NOT NULL`), (r) => r.boutId);
export const referencesByReignId = group(getReferences(`WHERE reign_id IS NOT NULL`), (r) => r.reignId);
