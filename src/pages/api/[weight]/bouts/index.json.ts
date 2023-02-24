import { getAllTitles, getWeightClassBouts } from "../../../../db";
import { slugify } from "../../../../utils";
import type { APIRoute } from "astro";

const weightClasses = [...new Set(getAllTitles().map((title) => title.weight.class))];

export const get: APIRoute = ({ params }) => {
	const weightClassBouts = getWeightClassBouts(params.weight as string);
	const weightClassBoutsWithoutReferences = weightClassBouts.map((weightClassBout) => {
		const { references, ...weightClassBoutWithoutReferences } = { ...weightClassBout };
		return weightClassBoutWithoutReferences;
	});

	return {
		body: JSON.stringify(weightClassBoutsWithoutReferences),
	};
};

export function getStaticPaths() {
	return weightClasses.map((weightClass) => ({
		params: {
			weight: slugify(weightClass),
		},
	}));
}
