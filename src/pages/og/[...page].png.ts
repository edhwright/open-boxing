// Each page's social image (see og.ts), and the site's own, og/default.png, for the home page and any page without one
import type { APIRoute, GetStaticPaths } from "astro";
import { getPageIndex } from "../../pageIndex";
import { defaultImage, pageImage } from "../../og";

export const getStaticPaths = (async () => [
	{ params: { page: "default" }, props: { name: null, kind: null } },
	...(await getPageIndex()).map((entry) => ({ params: { page: entry.slug }, props: { name: entry.name, kind: entry.kind } })),
]) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
	new Response(new Uint8Array(props.name === null ? defaultImage() : pageImage(props.name, props.kind)), { headers: { "Content-Type": "image/png" } });
