// The interactives' card drawings on the data page, as SVG files made at build time
import type { APIRoute, GetStaticPaths } from "astro";
import { thumbnails } from "../_components/thumbnails";

export const getStaticPaths = (() => Object.keys(thumbnails).map((name) => ({ params: { name } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => new Response(thumbnails[params.name!], { headers: { "Content-Type": "image/svg+xml" } });
