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

export const collections = {
	bouts: bouts,
};
