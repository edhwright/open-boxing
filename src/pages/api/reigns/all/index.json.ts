import { getAllReigns } from "../../../../db";
import type { APIRoute } from "astro";

export const get: APIRoute = () => {
	const allReigns = getAllReigns();
	const allReignsWithoutReferences = allReigns.map((reign) => {
		const { references, ...reignWithoutReferences } = { ...reign };
		return reignWithoutReferences;
	});

	return {
		body: JSON.stringify(allReignsWithoutReferences),
	};
};
