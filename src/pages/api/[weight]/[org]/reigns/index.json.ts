import { getAllTitles, getTitleReigns } from "../../../../../db";
import { slugify } from "../../../../../utils";
import type { APIRoute } from "astro";

const titles = await getAllTitles();

export const GET: APIRoute = async ({ params }) => {
	const titleReigns = await getTitleReigns(params.weight as string, params.org as string);
	const titleReignsWithoutReferences = titleReigns.map((titleReign) => {
		const { references, ...titleReignWithoutReferences } = { ...titleReign };
		return titleReignWithoutReferences;
	});

	return new Response(JSON.stringify(titleReignsWithoutReferences));
};

export function getStaticPaths() {
	return titles.map((title) => ({
		params: {
			weight: slugify(title.weight.class),
			org: slugify(title.org.name.abbreviation),
		},
	}));
}
