import { titleByTitleString, referencesByReignId, referencesByBoutId } from "./index";
import type { BoutResult, ChampionResult, ReignResult, TitleResult, ReferenceResult } from "./types";
import type { Bout, Champion, Title, Reign, Reference } from "../types";

export function processChampionResult(championResult: ChampionResult): Champion {
	return {
		championId: championResult.champion_id,
		name: {
			first: championResult.first_name,
			last: championResult.last_name,
			short: championResult.short_name,
		},
		born: championResult.born,
	};
}

export function processTitleResult(titleResult: TitleResult): Title {
	return {
		weight: {
			class: titleResult.weight_class,
			lb: titleResult.weight_lb,
		},
		org: {
			name: {
				full: titleResult.org_full_name,
				short: titleResult.org_short_name,
				abbreviation: titleResult.org_abbreviation,
			},
		},
		active: titleResult.active === 1,
	};
}

export function processReignResult(reignResult: ReignResult): Reign {
	const [orgAbbreviation, weightClass, weightLb] = reignResult.title.split("-");
	const title = titleByTitleString.get(`${orgAbbreviation}-${weightClass}`);
	if (!title) throw new Error(`couldn't find "${orgAbbreviation}-${weightClass}" title`);

	const reignReferences = referencesByReignId.get(reignResult.reign_id);

	return {
		reign_id: reignResult.reign_id,
		period: {
			begins: reignResult.begins,
			ends: reignResult.ends,
			current: reignResult.current === 1,
		},
		champion: {
			championId: reignResult.champion_id,
			name: {
				first: reignResult.first_name,
				last: reignResult.last_name,
				short: reignResult.short_name,
			},
			born: reignResult.born,
		},
		title: {
			...title,
			weight: {
				class: weightClass,
				lb: weightLb,
			},
		},
		references: reignReferences ? reignReferences : [],
	};
}

export function processBoutResult(boutResult: BoutResult): Bout {
	const titleStrings = boutResult.titles.split(",");
	const titles = titleStrings.map((titleString) => {
		const [orgAbbreviation, weightClass, weightLb] = titleString.split("-");
		const title = titleByTitleString.get(`${orgAbbreviation}-${weightClass}`);
		if (!title) throw new Error(`couldn't find "${orgAbbreviation}-${weightClass}" title`);

		return {
			...title,
			weight: {
				class: weightClass,
				lb: weightLb,
			},
		};
	});

	const boutReferences = referencesByBoutId.get(boutResult.bout_id);

	return {
		boutId: boutResult.bout_id,
		date: boutResult.date,
		boxers: {
			boxerA: boutResult.a_champion_id
				? {
						championId: boutResult.a_champion_id,
						name: { first: boutResult.a_first_name as string, last: boutResult.a_last_name as string, short: boutResult.a_short_name as string },
						born: boutResult.a_born as string,
				  }
				: { name: boutResult.a_default_name },
			boxerB: boutResult.b_champion_id
				? {
						championId: boutResult.b_champion_id,
						name: { first: boutResult.b_first_name as string, last: boutResult.b_last_name as string, short: boutResult.b_short_name as string },
						born: boutResult.b_born as string,
				  }
				: { name: boutResult.b_default_name },
		},
		status: boutResult.status,
		result: {
			winner: boutResult.winner,
			methodOfVictory: boutResult.method_of_victory,
			totalRounds: boutResult.total_rounds,
		},
		scheduledRounds: boutResult.scheduled_rounds,
		weight: {
			class: boutResult.weight_class,
			lb: boutResult.weight_lb,
		},
		titles: titles,
		location: {
			locationId: boutResult.location_id,
			venue: boutResult.venue,
			locality: boutResult.locality,
			country: boutResult.country,
			latitude: boutResult.latitude,
			longitude: boutResult.longitude,
		},
		references: boutReferences ? boutReferences : [],
	};
}

export function processReferenceResult(referenceResult: ReferenceResult): Reference {
	return {
		referenceId: referenceResult.reference_id,
		title: referenceResult.title,
		author: referenceResult.author,
		publication: referenceResult.publication,
		publicationDate: referenceResult.publication_date,
		boutId: referenceResult.bout_id,
		reignId: referenceResult.reign_id,
		eventDate: referenceResult.event_date,
		link: {
			text: referenceResult.link_text,
			url: referenceResult.link_url,
		},
	};
}
