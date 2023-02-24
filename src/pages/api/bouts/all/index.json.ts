import { getAllBouts } from "../../../../db";
import type { APIRoute } from "astro";

export const get: APIRoute = () => {
	const allBouts = getAllBouts();
	const allBoutsWithoutReferences = allBouts.map((bout) => {
		const { references, ...boutWithoutReferences } = { ...bout };
		return boutWithoutReferences;
	});

	return {
		body: JSON.stringify(allBoutsWithoutReferences),
	};
};
