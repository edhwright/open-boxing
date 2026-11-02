// Shapes the rows returned by ./api.ts into the objects used by the pages and the JSON API (see ../types.ts)
import { group } from "d3-array";
import * as api from "./api";
import type { BoutWithTitles } from "./api";
import { WEIGHT_CLASSES, type WeightClass } from "./types";
import type { Bout, Boxer, Champion, Title, Reign, Reference } from "../types";

type ChampionRow = Awaited<ReturnType<typeof api.getChampion>>;
type TitleRow = Awaited<ReturnType<typeof api.getAllTitles>>[number];
type ReignRow = Awaited<ReturnType<typeof api.getAllReigns>>[number];
type ReferenceRow = Awaited<ReturnType<typeof api.getAllReferences>>[number];

function toChampion(champion: ChampionRow): Champion {
	return {
		championId: champion.champion_id,
		name: {
			first: champion.first_name,
			last: champion.last_name,
			short: champion.short_name,
		},
		born: champion.born,
	};
}

// weightLb defaults to the title's latest weight limit, but reigns and bouts use the limit at the time
function toTitle(title: TitleRow, weightLb: string = title.latest_weight_lb): Title {
	return {
		weight: {
			class: title.weight_class,
			lb: weightLb,
		},
		org: {
			name: {
				full: title.org_full_name,
				short: title.org_short_name,
				abbreviation: title.org_abbreviation,
			},
		},
		active: title.active,
	};
}

function toReference(reference: ReferenceRow): Reference {
	return {
		referenceId: reference.reference_id,
		title: reference.headline,
		author: reference.author,
		publication: reference.publication,
		publicationDate: reference.publication_date,
		boutId: reference.bout_id,
		reignId: reference.reign_id,
		eventDate: reference.event_date,
		link: {
			text: reference.link_text,
			url: reference.link,
		},
	};
}

const allReferences = (await api.getAllReferences()).map(toReference);
const referencesByBoutId = group(
	allReferences.filter((r) => r.boutId !== null),
	(r) => r.boutId,
);
const referencesByReignId = group(
	allReferences.filter((r) => r.reignId !== null),
	(r) => r.reignId,
);

function toReign(row: ReignRow): Reign {
	return {
		reign_id: row.Reign.reign_id,
		period: {
			begins: row.Reign.begins,
			ends: row.Reign.ends,
			current: row.Reign.is_current_champion,
		},
		champion: toChampion(row.Champion),
		title: toTitle(row.Title, row.Reign.weight_lb),
		references: referencesByReignId.get(row.Reign.reign_id) ?? [],
	};
}

function toBoxer(champion: ChampionRow | null, name: string): Boxer {
	return champion ? toChampion(champion) : { name: name };
}

function toBout(bout: BoutWithTitles): Bout {
	return {
		boutId: bout.bout_id,
		date: bout.date,
		boxers: {
			boxerA: toBoxer(bout.ChampionA, bout.boxer_a_name),
			boxerB: toBoxer(bout.ChampionB, bout.boxer_b_name),
		},
		status: bout.status,
		result: {
			winner: bout.winner,
			methodOfVictory: bout.method_of_victory,
			totalRounds: bout.total_rounds,
		},
		scheduledRounds: bout.scheduled_rounds,
		weight: {
			class: bout.weight_class,
			lb: bout.weight_lb,
		},
		titles: bout.titles.map((title) => toTitle(title, title.weight_lb)),
		location: {
			locationId: bout.Location?.location_id ?? null,
			venue: bout.Location?.latest_venue_name ?? null,
			locality: bout.Location?.locality ?? null,
			country: bout.Location?.country ?? null,
			latitude: bout.Location?.latitude ?? null,
			longitude: bout.Location?.longitude ?? null,
		},
		references: referencesByBoutId.get(bout.bout_id) ?? [],
	};
}

// weight classes and orgs can be given as names or slugs, e.g. "Light Heavyweight" or "light-heavyweight", "NYSAC" or "nysac"
function normalise(s: string) {
	return s.replaceAll("-", " ").toLowerCase();
}

function findWeightClass(weightClass: string): WeightClass | undefined {
	return WEIGHT_CLASSES.find((wc) => normalise(wc) === normalise(weightClass));
}

async function findTitle(weightClass: string, orgAbbreviation: string) {
	const titles = await api.getAllTitles();
	return titles.find((t) => normalise(t.weight_class) === normalise(weightClass) && normalise(t.org_abbreviation) === normalise(orgAbbreviation));
}

//////////////// champions ////////////////

export async function getAllChampions() {
	return (await api.getAllChampions()).map(toChampion);
}

export async function getChampion(championId: number) {
	return toChampion(await api.getChampion(championId));
}

//////////////// titles ////////////////

export async function getAllTitles() {
	return (await api.getAllTitles()).map((title) => toTitle(title));
}

//////////////// reigns ////////////////

export async function getAllReigns() {
	return (await api.getAllReigns()).map(toReign);
}

export async function getTitleReigns(weightClass: string, orgAbbreviation: string) {
	const title = await findTitle(weightClass, orgAbbreviation);
	return title ? (await api.getTitleReigns(title.title_id)).map(toReign) : [];
}

export async function getWeightClassReigns(weightClass: string) {
	const wc = findWeightClass(weightClass);
	return wc ? (await api.getWeightClassReigns(wc)).map(toReign) : [];
}

export async function getChampionReigns(championId: number) {
	return (await api.getChampionReigns(championId)).map(toReign);
}

// returns null if the title doesn't exist or has never had a champion
export async function getLatestTitleReign(weightClass: string, orgAbbreviation: string) {
	const title = await findTitle(weightClass, orgAbbreviation);
	const reign = title ? await api.getLatestTitleReign(title.title_id) : undefined;
	return reign ? toReign(reign) : null;
}

export async function getLatestReigns(limit: number) {
	return (await api.getLatestReigns(limit)).map(toReign);
}

//////////////// bouts ////////////////

export async function getAllBouts() {
	return (await api.getAllBouts()).map(toBout);
}

export async function getScheduledBouts() {
	return (await api.getScheduledBouts()).map(toBout);
}

export async function getBout(boutId: number) {
	return toBout(await api.getBout(boutId));
}

export async function getTitleBouts(weightClass: string, orgAbbreviation: string) {
	const title = await findTitle(weightClass, orgAbbreviation);
	return title ? (await api.getTitleBouts(title.title_id)).map(toBout) : [];
}

export async function getScheduledTitleBouts(weightClass: string, orgAbbreviation: string) {
	const title = await findTitle(weightClass, orgAbbreviation);
	return title ? (await api.getScheduledTitleBouts(title.title_id)).map(toBout) : [];
}

export async function getWeightClassBouts(weightClass: string) {
	const wc = findWeightClass(weightClass);
	return wc ? (await api.getWeightClassBouts(wc)).map(toBout) : [];
}

export async function getScheduledWeightClassBouts(weightClass: string) {
	const wc = findWeightClass(weightClass);
	return wc ? (await api.getScheduledWeightClassBouts(wc)).map(toBout) : [];
}

export async function getNextScheduledWeightClassBout(weightClass: string) {
	const wc = findWeightClass(weightClass);
	const bout = wc ? await api.getNextScheduledWeightClassBout(wc) : null;
	return bout ? toBout(bout) : undefined;
}

export async function getChampionBouts(championId: number) {
	return (await api.getChampionBouts(championId)).map(toBout);
}
