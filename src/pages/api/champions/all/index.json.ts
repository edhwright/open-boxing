import { getAllChampions } from "../../../../db";
import type { APIRoute } from "astro";

export const get: APIRoute = () => {
	const allChampions = getAllChampions();

	return {
		body: JSON.stringify(allChampions),
	};
};
