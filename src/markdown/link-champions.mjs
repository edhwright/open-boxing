// A Markdown plugin for the transcribed articles: links the first mention of each world champion's full name in an
// article's body text to their page, e.g. "Pancho Villa" to /champions/38/.
// - only running text: paragraphs, list items and quotes, never headings, tables, captions or existing links
// - skips The Boxing Blade's results and future bouts listings, which are tables of names
// - only champions born before the article was published, and only names no two champions share
import { readFileSync } from "node:fs";
import { csvParse } from "d3-dsv";

const champions = csvParse(readFileSync(new URL("../../data/champions.csv", import.meta.url), "utf-8"));
const counts = new Map();
for (const c of champions) {
	const name = `${c.first_name} ${c.last_name}`;
	counts.set(name, (counts.get(name) ?? 0) + 1);
}
const byName = new Map(champions.filter((c) => counts.get(`${c.first_name} ${c.last_name}`) === 1).map((c) => [`${c.first_name} ${c.last_name}`, c]));

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]");
// longest names first, so "Sugar Ray Robinson" wins over any shorter name inside it
const names = [...byName.keys()].sort((a, b) => b.length - a.length);
const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${names.map(escape).join("|")})(?![\\p{L}\\p{N}])`, "u");
const key = (text) => text.replace(/’/g, "'");

const SKIP_FILES = /(boxing-results|future-bouts)/;
const TEXT = new Set(["p", "li", "blockquote"]);
const SKIP = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "table", "a", "code", "pre", "figcaption"]);

// A Sätteri hast plugin (Astro 7's Markdown processor). Made per document, so each article links each champion once.
export default function linkChampions({ fileURL, source }) {
	if (SKIP_FILES.test(fileURL?.pathname ?? "")) return null;
	const published = source.match(/^publicationDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1] ?? "9999-12-31";
	const linked = new Set();

	// the first name in a run of text still to link: [index, name, champion] or null
	const find = (text) => {
		let rest = text;
		let offset = 0;
		for (;;) {
			const m = rest.match(pattern);
			if (!m) return null;
			const c = byName.get(key(m[1]));
			if (c && !linked.has(c.champion_id) && c.born < published) return [offset + m.index, m[1], c];
			offset += m.index + m[1].length;
			rest = rest.slice(m.index + m[1].length);
		}
	};

	return {
		name: "link-champions",
		text(node, ctx) {
			// only running text: inside a paragraph, list item or quote, and not inside a heading, table or link
			let inText = false;
			for (let p = ctx.parent(node); p && p.type === "element"; p = ctx.parent(p)) {
				if (SKIP.has(p.tagName)) return;
				if (TEXT.has(p.tagName)) inText = true;
			}
			if (!inText) return;
			let text = node.value;
			const parts = [];
			let found;
			while ((found = find(text))) {
				const [index, name, c] = found;
				linked.add(c.champion_id);
				if (index > 0) parts.push({ type: "text", value: text.slice(0, index) });
				parts.push({ type: "element", tagName: "a", properties: { href: `/champions/${c.champion_id}/` }, children: [{ type: "text", value: name }] });
				text = text.slice(index + name.length);
			}
			if (!parts.length) return;
			if (text) parts.push({ type: "text", value: text });
			ctx.replaceNode(node, parts);
		},
	};
}
