import { getAllBouts } from "../../../../db";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const allBouts = await getAllBouts();
	const allBoutsWithoutReferences = allBouts.map((bout) => {
		const { references, ...boutWithoutReferences } = { ...bout };
		return boutWithoutReferences;
	});

	return new Response(JSON.stringify(allBoutsWithoutReferences));
};
