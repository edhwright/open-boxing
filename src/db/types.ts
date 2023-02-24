export interface ChampionInsert {
	champion_id: number;
	first_name: string;
	last_name: string;
	short_name: string;
	born: string;
}

export type ChampionResult = ChampionInsert;

export interface TitleInsert {
	title_id: number;
	org_full_name: string;
	org_short_name: string;
	org_abbreviation: string;
	active: 0 | 1;
	weight_class: string;
	weight_lb: string;
}

export type TitleResult = TitleInsert;

export interface ReignInsert {
	reign_id: number;
	begins: string;
	ends: string | null;
	champion_id: number;
	name: string;
	current: 0 | 1;
	title: string;
}

export interface ReignResult {
	reign_id: number;
	begins: string;
	ends: string | null;
	champion_id: number;
	first_name: string;
	last_name: string;
	short_name: string;
	born: string;
	current: 0 | 1;
	title: string;
}

export interface LocationInsert {
	location_id: number;
	venue: string;
	locality: string;
	country: string;
	latitude: number;
	longitude: number;
}

export interface BoutInsert {
	bout_id: number;
	date: string;
	boxer_a_name: string;
	boxer_a_champion_id: number | null;
	boxer_b_name: string;
	boxer_b_champion_id: number | null;
	status: "FINISHED" | "SCHEDULED";
	winner: "BOXER A" | "BOXER B" | "DRAW" | "NO CONTEST" | null;
	method_of_victory: string | null;
	total_rounds: number | null;
	scheduled_rounds: number;
	weight_class: string;
	weight_lb: string;
	titles: string;
	location_id: number | null;
}

export interface BoutResult {
	bout_id: number;
	date: string;
	a_default_name: string;
	a_champion_id: number | null;
	a_first_name: string | null;
	a_last_name: string | null;
	a_short_name: string | null;
	a_born: string | null;
	b_default_name: string;
	b_champion_id: number | null;
	b_first_name: string | null;
	b_last_name: string | null;
	b_short_name: string | null;
	b_born: string | null;
	status: "FINISHED" | "SCHEDULED";
	winner: "BOXER A" | "BOXER B" | "DRAW" | "NO CONTEST" | null;
	method_of_victory: string | null;
	total_rounds: number | null;
	scheduled_rounds: number;
	weight_class: string;
	weight_lb: string;
	titles: string;
	location_id: number | null;
	venue: string | null;
	locality: string | null;
	country: string | null;
	latitude: number | null;
	longitude: number | null;
}

export interface ReferenceInsert {
	reference_id: number;
	title: string;
	author: string;
	publication: string;
	publication_date: string;
	bout_id: number;
	reign_id: number;
	event_date: string;
	link_text: string;
	link_url: string;
}

export type ReferenceResult = ReferenceInsert;
