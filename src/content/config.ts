import { z, defineCollection } from "astro:content";

export const collections = {
	bouts: defineCollection({
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
	}),
};
