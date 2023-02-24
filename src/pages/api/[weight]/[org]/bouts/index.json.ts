import { getAllTitles, getTitleBouts } from "../../../../../db";
import { slugify } from "../../../../../utils";
import type { APIRoute } from "astro";

const titles = getAllTitles();

export const get: APIRoute = ({ params }) => {
	const titleBouts = getTitleBouts(params.weight as string, params.org as string);
	const titleBoutsWithoutReferences = titleBouts.map((titleBout) => {
		const { references, ...titleBoutWithoutReferences } = { ...titleBout };
		return titleBoutWithoutReferences;
	});

	return {
		body: JSON.stringify(titleBoutsWithoutReferences),
	};
};

export function getStaticPaths() {
	return titles.map((title) => ({
		params: {
			weight: slugify(title.weight.class),
			org: slugify(title.org.name.abbreviation),
		},
	}));
}
