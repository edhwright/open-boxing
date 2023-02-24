import { getAllTitles, getWeightClassReigns } from "../../../../db";
import { slugify } from "../../../../utils";
import type { APIRoute } from "astro";

const weightClasses = [...new Set(getAllTitles().map((title) => title.weight.class))];

export const get: APIRoute = ({ params }) => {
	const weightClassReigns = getWeightClassReigns(params.weight as string);
	const weightClassReignsWithoutReferences = weightClassReigns.map((weightClassReign) => {
		const { references, ...weightClassReignWithoutReferences } = { ...weightClassReign };
		return weightClassReignWithoutReferences;
	});

	return {
		body: JSON.stringify(weightClassReignsWithoutReferences),
	};
};

export function getStaticPaths() {
	return weightClasses.map((weightClass) => ({
		params: {
			weight: slugify(weightClass),
		},
	}));
}
