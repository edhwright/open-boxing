import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { WEIGHT_CLASSES } from "./types";

// dates are stored as "YYYY-MM-DD" text, so they sort correctly and don't shift with time zones

export const Champion = sqliteTable("Champion", {
	champion_id: integer().primaryKey(),
	first_name: text().notNull(),
	last_name: text().notNull(),
	short_name: text().notNull(),
	born: text().notNull(),
});

export const Location = sqliteTable("Location", {
	location_id: integer().primaryKey(),
	latest_venue_name: text().notNull(),
	locality: text().notNull(),
	country: text().notNull(),
	latitude: real().notNull(),
	longitude: real().notNull(),
});

export const Title = sqliteTable("Title", {
	title_id: integer().primaryKey(),
	org_full_name: text().notNull(),
	org_short_name: text().notNull(),
	org_abbreviation: text().notNull(),
	active: integer({ mode: "boolean" }).notNull(),
	weight_class: text({ enum: WEIGHT_CLASSES }).notNull(),
	latest_weight_lb: text().notNull(),
});

export const Bout = sqliteTable("Bout", {
	bout_id: integer().primaryKey(),
	date: text().notNull(),
	boxer_a_id: integer().references(() => Champion.champion_id),
	boxer_a_name: text().notNull(),
	boxer_b_id: integer().references(() => Champion.champion_id),
	boxer_b_name: text().notNull(),
	status: text({ enum: ["SCHEDULED", "FINISHED"] }).notNull(),
	winner: text({ enum: ["BOXER A", "BOXER B", "DRAW", "NO CONTEST"] }),
	method_of_victory: text(),
	total_rounds: integer(),
	scheduled_rounds: integer().notNull(),
	weight_class: text({ enum: WEIGHT_CLASSES }).notNull(),
	weight_lb: text().notNull(),
	location_id: integer().references(() => Location.location_id),
	location_venue: text(),
});

export const BoutTitle = sqliteTable("BoutTitle", {
	bout_id: integer()
		.notNull()
		.references(() => Bout.bout_id),
	title_id: integer()
		.notNull()
		.references(() => Title.title_id),
	// the title's weight limit at the time of the bout, e.g. "175+" in "NYSAC-Heavyweight-175+"
	weight_lb: text().notNull(),
	// order the titles are listed in bouts.csv
	position: integer().notNull(),
});

export const Reign = sqliteTable("Reign", {
	reign_id: integer().primaryKey(),
	begins: text().notNull(),
	ends: text(),
	champion_id: integer()
		.notNull()
		.references(() => Champion.champion_id),
	name: text().notNull(),
	is_current_champion: integer({ mode: "boolean" }).notNull(),
	title_id: integer()
		.notNull()
		.references(() => Title.title_id),
	// the title's weight limit during the reign, e.g. "175+" in "NYSAC-Heavyweight-175+"
	weight_lb: text().notNull(),
});

export const Reference = sqliteTable("Reference", {
	reference_id: integer().primaryKey(),
	headline: text().notNull(),
	author: text(),
	publication: text().notNull(),
	publication_date: text().notNull(),
	bout_id: integer().references(() => Bout.bout_id),
	reign_id: integer().references(() => Reign.reign_id),
	event_date: text().notNull(),
	link_text: text().notNull(),
	link: text().notNull(),
});
