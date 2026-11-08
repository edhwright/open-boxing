import { defineConfig, fontProviders } from "astro/config";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { satteri } from "@astrojs/markdown-satteri";
import dropTitle from "./src/markdown/drop-title.mjs";
import articleImages from "./src/markdown/article-images.mjs";
import linkChampions from "./src/markdown/link-champions.mjs";
import stripComments from "./src/integrations/strip-comments.mjs";
import { sitemapDates } from "./src/integrations/sitemap-dates.mjs";

// each page's last-modified date in the sitemap, from the data it shows
const lastmod = sitemapDates();

// The fonts, from the Fontsource packages installed (so their versions are pinned and the build needs no network):
// Latin files only, which cover everything the site writes. Astro serves them, preloads the ones a page asks for and
// makes a fallback font sized to match each, so text doesn't jump when the font arrives (see layouts/Layout.astro)
const font = (name, cssVariable, fallback, variants) => ({
	provider: fontProviders.local(),
	name,
	cssVariable,
	fallbacks: [fallback],
	options: { variants: variants.map(([file, weight, style]) => ({ src: [file], weight, style })) },
});
const fonts = [
	font("Inter Variable", "--font-inter", "sans-serif", [
		["@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "100 900", "normal"],
		["@fontsource-variable/inter/files/inter-latin-wght-italic.woff2", "100 900", "italic"],
	]),
	font("Source Serif 4 Variable", "--font-source-serif", "serif", [
		["@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2", "200 900", "normal"],
		["@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2", "200 900", "italic"],
	]),
	font("IBM Plex Serif", "--font-plex-serif", "serif", [
		["@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-normal.woff2", 400, "normal"],
		["@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-italic.woff2", 400, "italic"],
		["@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-600-normal.woff2", 600, "normal"],
	]),
	font("DM Serif Display", "--font-dm-serif", "serif", [["@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2", 400, "normal"]]),
	font("IBM Plex Mono", "--font-plex-mono", "monospace", [
		["@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", 400, "normal"],
		["@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", 500, "normal"],
	]),
];

// https://astro.build/config
export default defineConfig({
	fonts,
	integrations: [
		svelte(),
		sitemap({
			serialize(item) {
				const date = lastmod.get(new URL(item.url).pathname);
				return date ? { ...item, lastmod: date } : item;
			},
		}),
		stripComments(),
	],
	markdown: {
		// drops the transcribed articles' printed headlines (the pages show their titles), sizes their images for the
		// reading column, and links champions' names in them to their pages
		processor: satteri({ hastPlugins: [dropTitle, articleImages, linkChampions] }),
		shikiConfig: {
			theme: "nord",
		},
	},
	site: "https://openboxing.org",
	vite: {
		plugins: [tailwindcss()],
	},
});
