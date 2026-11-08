// The site's search index: every page's name, other names it goes by and its address (see pageIndex.ts), fetched by
// the header's search once someone opens it. Not part of the public API.
import { getPageIndex } from "../pageIndex";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const pages = await getPageIndex();
	return new Response(JSON.stringify(pages.map(({ name, slug, also }) => ({ name, slug, also }))));
};
