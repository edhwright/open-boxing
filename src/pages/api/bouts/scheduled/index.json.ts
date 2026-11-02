import { getScheduledBouts } from "../../../../db";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const scheduledBouts = await getScheduledBouts();
	const scheduledBoutsWithoutReferences = scheduledBouts.map((scheduledBout) => {
		const { references, ...scheduledBoutWithoutReferences } = { ...scheduledBout };
		return scheduledBoutWithoutReferences;
	});

	return new Response(JSON.stringify(scheduledBoutsWithoutReferences));
};
