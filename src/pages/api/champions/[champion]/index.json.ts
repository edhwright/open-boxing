import { getAllChampions, getChampion, getChampionReigns, getChampionBouts } from "../../../../db";
import type { APIRoute } from "astro";

const champions = await getAllChampions();

export const GET: APIRoute = async ({ params }) => {
	const champion = await getChampion(parseInt(params.champion as string));
	const championReigns = await getChampionReigns(champion.championId);
	const championBouts = await getChampionBouts(champion.championId);

	const championReignsWithoutReferences = championReigns.map((championReign) => {
		const { references, ...championReignWithoutReferences } = { ...championReign };
		return championReignWithoutReferences;
	});

	const championBoutsWithoutReferences = championBouts.map((championBout) => {
		const { references, ...championBoutWithoutReferences } = { ...championBout };
		return championBoutWithoutReferences;
	});

	return new Response(
		JSON.stringify({
			champion: champion,
			reigns: championReignsWithoutReferences,
			bouts: championBoutsWithoutReferences,
		}),
	);
};

export function getStaticPaths() {
	return champions.map((champion) => ({
		params: {
			champion: String(champion.championId),
		},
	}));
}
