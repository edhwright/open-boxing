import { getAllChampions } from "../../../../db";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const allChampions = await getAllChampions();

	return new Response(JSON.stringify(allChampions));
};
