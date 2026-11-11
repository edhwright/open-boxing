// The Boxing Blade's issues, oldest first, each with its page's address and its articles, ordered by page
import { getCollection, type CollectionEntry } from "astro:content";

export const issueHref = (data: { volume: number; number: number }) => `/articles/the-boxing-blade/volume-${data.volume}-number-${data.number}/`;

export async function getBladeIssues() {
	const [issues, articles] = await Promise.all([getCollection("bladeIssues"), getCollection("bladeArticles")]);
	return issues
		.sort((a, b) => a.data.publicationDate.localeCompare(b.data.publicationDate))
		.map((issue) => ({
			issue,
			href: issueHref(issue.data),
			articles: articles
				.filter((a) => a.data.volume === issue.data.volume && a.data.number === issue.data.number)
				.sort((a, b) => a.data.pages[0] - b.data.pages[0] || a.id.localeCompare(b.id)) as CollectionEntry<"bladeArticles">[],
		}));
}
