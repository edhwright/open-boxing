import { getScheduledBouts } from "../../../../db";
import type { APIRoute } from "astro";

export const get: APIRoute = () => {
	const scheduledBouts = getScheduledBouts();
	const scheduledBoutsWithoutReferences = scheduledBouts.map((scheduledBout) => {
		const { references, ...scheduledBoutWithoutReferences } = { ...scheduledBout };
		return scheduledBoutWithoutReferences;
	});

	return {
		body: JSON.stringify(scheduledBoutsWithoutReferences),
	};
};
