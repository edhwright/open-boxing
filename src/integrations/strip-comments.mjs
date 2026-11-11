// Removes the comments left in the built pages: Svelte marks where its components' blocks start and end with
// comments such as <!--[--> so it can take them over in the browser, but the site's Svelte components that render on
// the server never do (the interactives render only in the browser), so the marks are dead weight. Script and style
// contents are left alone.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const strip = (html) =>
	html
		.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/)
		.map((part, i) => (i % 2 ? part : part.replace(/<!--[\s\S]*?-->/g, "")))
		.join("");

const htmlFiles = async (dir) =>
	(await fs.readdir(dir, { recursive: true })).filter((f) => f.endsWith(".html")).map((f) => path.join(dir, f));

export default function stripComments() {
	return {
		name: "strip-comments",
		hooks: {
			"astro:build:done": async ({ dir }) => {
				const files = await htmlFiles(fileURLToPath(dir));
				await Promise.all(files.map(async (file) => fs.writeFile(file, strip(await fs.readFile(file, "utf8")))));
			},
		},
	};
}
