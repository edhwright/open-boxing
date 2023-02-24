import { getAllChampions, getAllTitles } from "../../../db";
import { slugify, getAllFeaturedBoutPreviews } from "../../../utils";
import type { APIRoute } from "astro";

export const get: APIRoute = async () => {
	const champions = getAllChampions().map((champion) => ({
		name: `${champion.name.first} ${champion.name.last}`,
		slug: `champions/${champion.championId}`,
	}));

	const weightClasses = [...new Set(getAllTitles().map((title) => title.weight.class))].map((weightClass) => ({
		name: weightClass,
		slug: slugify(weightClass),
	}));

	const titles = getAllTitles().map((title) => ({
		name: `${title.org.name.full} ${title.weight.class}`,
		slug: `${slugify(title.weight.class)}/${slugify(title.org.name.abbreviation)}`,
	}));

	const featuredBouts = await getAllFeaturedBoutPreviews().then((featuredBoutPreviews) => {
		return featuredBoutPreviews.map((featuredBout) => ({
			name: featuredBout.name,
			slug: `articles/${featuredBout.bout.date}-${slugify(featuredBout.name)}`,
		}));
	});

	const search = [...champions, ...weightClasses, ...titles, ...featuredBouts].sort((a, b) => a.name.localeCompare(b.name));

	return {
		body: JSON.stringify(search),
	};
};
