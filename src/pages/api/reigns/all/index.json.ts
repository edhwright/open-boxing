import { getAllReigns } from "../../../../db";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const allReigns = await getAllReigns();
	const allReignsWithoutReferences = allReigns.map((reign) => {
		const { references, ...reignWithoutReferences } = { ...reign };
		return reignWithoutReferences;
	});

	return new Response(JSON.stringify(allReignsWithoutReferences));
};
