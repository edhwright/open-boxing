import { getAllChampions, getChampion, getChampionReigns, getChampionBouts } from "../../../../db";
import type { APIRoute } from "astro";

const champions = getAllChampions();

export const get: APIRoute = ({ params }) => {
	const champion = getChampion(parseInt(params.champion as string));
	const championReigns = getChampionReigns(champion.championId);
	const championBouts = getChampionBouts(champion.championId);

	const championReignsWithoutReferences = championReigns.map((championReign) => {
		const { references, ...championReignWithoutReferences } = { ...championReign };
		return championReignWithoutReferences;
	});

	const championBoutsWithoutReferences = championBouts.map((championBout) => {
		const { references, ...championBoutWithoutReferences } = { ...championBout };
		return championBoutWithoutReferences;
	});

	return {
		body: JSON.stringify({
			champion: champion,
			reigns: championReignsWithoutReferences,
			bouts: championBoutsWithoutReferences,
		}),
	};
};

export function getStaticPaths() {
	return champions.map((champion) => ({
		params: {
			champion: champion.championId,
		},
	}));
}
