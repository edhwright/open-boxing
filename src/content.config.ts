import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const bouts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/bouts" }),
	schema: z.object({
		title: z.string(),
		author: z.string().nullable(),
		publication: z.string(),
		publicationDate: z.string(),
		link: z.string(),
		boutId: z.number(),
		featured: z.boolean(),
		thumbnail: z.string().optional(),
	}),
});

// The Boxing Blade: one folder per issue, volume-<n>/number-<n>, with issue.yaml, the front page (cover.jpg)
// and one .md per article. The cover is an image() so Astro resizes and compresses it at build time
const bladeIssues = defineCollection({
	loader: glob({ pattern: "**/issue.yaml", base: "./src/content/the-boxing-blade" }),
	schema: ({ image }) => z.object({
		publication: z.string(),
		volume: z.number(),
		number: z.number(),
		publicationDate: z.string(),
		place: z.string(),
		edition: z.string(),
		price: z.string(),
		pages: z.number(),
		cover: image(),
		link: z.string(),
		credit: z.string(),
	}),
});

const bladeArticles = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/the-boxing-blade" }),
	schema: z.object({
		publication: z.string(),
		volume: z.number(),
		number: z.number(),
		pages: z.array(z.number()),
		publicationDate: z.string(),
		author: z.string().nullable(),
		// ids in the data: the champions, reigns and bouts the article is about
		champions: z.array(z.number()),
		reigns: z.array(z.number()),
		bouts: z.array(z.number()),
		link: z.string(),
	}),
});

export const collections = {
	bouts: bouts,
	bladeIssues: bladeIssues,
	bladeArticles: bladeArticles,
};
