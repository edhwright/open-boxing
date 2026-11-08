// The social images shown when a page is shared, drawn at build time (pages/og/[...page].png.ts): the logo, then the
// page's name, with what kind of page it is above it. The text is drawn as outlines from the site's heading font
// (IBM Plex Serif), so the images look the same wherever they are made, and the SVG is turned into a PNG.
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const MARGIN = 80;
const INK = "#1a1a17";
const MUTED = "#4e4a44";
const CREAM = "#fffff4";

const fontFile = (name: string) => {
	const buffer = fs.readFileSync(path.join(process.cwd(), "node_modules/@fontsource/ibm-plex-serif/files", name));
	return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};
// each weight in the Latin set, then the extended Latin set for the letters it lacks, e.g. in some boxers' names
const fonts = (weight: number) => [fontFile(`ibm-plex-serif-latin-${weight}-normal.woff`), fontFile(`ibm-plex-serif-latin-ext-${weight}-normal.woff`)];
const semibold = fonts(600);
const regular = fonts(400);

// a line of text's outline and width, each letter from the first font that has it, kerned within a font
const layout = (set: opentype.Font[], text: string, size: number, x = 0, y = 0) => {
	const paths: string[] = [];
	let advance = 0;
	let previous: { font: opentype.Font; glyph: opentype.Glyph } | null = null;
	// a no-break space (see pageImage) is drawn as a space
	for (const char of text.replace(/\u00a0/g, " ")) {
		const font = set.find((f) => f.charToGlyphIndex(char) > 0) ?? set[0];
		const glyph = font.charToGlyph(char);
		const scale = size / font.unitsPerEm;
		if (previous && previous.font === font) advance += font.getKerningValue(previous.glyph, glyph) * scale;
		paths.push(glyph.getPath(x + advance, y, size).toPathData(2));
		advance += (glyph.advanceWidth ?? 0) * scale;
		previous = { font, glyph };
	}
	return { d: paths.join(""), width: advance };
};

// words onto lines no wider than `width`
const wrap = (set: opentype.Font[], text: string, size: number, width: number) => {
	const lines: string[] = [];
	for (const word of text.split(" ")) {
		const line = lines.at(-1);
		if (line !== undefined && layout(set, `${line} ${word}`, size).width <= width) lines[lines.length - 1] = `${line} ${word}`;
		else lines.push(word);
	}
	return lines;
};

// the logo (public/logo.svg) placed with the left edge of its O at `x`: the timeline's fade hangs to its left, as in the
// header. Its O starts 72 units into the drawing
const logoSVG = fs.readFileSync(path.join(process.cwd(), "public/logo.svg"), "utf8");
const logoViewBox = logoSVG.match(/viewBox="([^"]+)"/)![1];
const logoInner = logoSVG
	.replace(/^[\s\S]*?<svg[^>]*>/, "")
	.replace(/<\/svg>\s*$/, "")
	.replace(/<title>[\s\S]*?<\/title>/, "")
	.replace(/<!--[\s\S]*?-->/g, "");
const [, , logoW, logoH] = logoViewBox.split(" ").map(Number);
const logo = (x: number, y: number, height: number) => {
	const width = (logoW * height) / logoH;
	return `<svg x="${(x - (72 * height) / logoH).toFixed(1)}" y="${y}" width="${width.toFixed(1)}" height="${height}" viewBox="${logoViewBox}">${logoInner}</svg>`;
};

// the text is already outlines, so no fonts are loaded (loading the system's takes most of the time)
const png = (svg: string) => new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH }, font: { loadSystemFonts: false } }).render().asPng();
const frame = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}"><rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${CREAM}"/>${body}</svg>`;

// the site's own image: the logo alone, large in the middle
export const defaultImage = () => {
	const height = 120;
	// the logo's ink runs from 72 units into the drawing to 72 units from its end, so that span is centred
	const inkLeft = (OG_WIDTH - ((logoW - 144) * height) / logoH) / 2;
	return png(frame(logo(inkLeft, (OG_HEIGHT - height) / 2, height)));
};

// a page's image: the logo top left with a rule under it, as the site's header, then the page's name at the bottom,
// as large as fits on three lines
export const pageImage = (pageName: string, kind: string | null) => {
	// lines break only at spaces, so no-break spaces keep a date ("2nd December 1922") on one line, and the last two
	// words together, so a line never ends on one word alone, e.g. "world title"
	const keep = (s: string) => s.replace(/\d{1,2}(st|nd|rd|th) [A-Z][a-z]+ \d{4}/g, (date) => date.replace(/ /g, "\u00a0"));
	const words = keep(pageName).split(" ");
	const name = words.length > 2 && !words.at(-1)!.includes("\u00a0") ? `${words.slice(0, -2).join(" ")} ${words.slice(-2).join("\u00a0")}` : words.join(" ");
	let size = 88;
	let lines = wrap(semibold, name, size, OG_WIDTH - 2 * MARGIN);
	const tooWide = () => lines.some((line) => layout(semibold, line, size).width > OG_WIDTH - 2 * MARGIN);
	while ((lines.length > 3 || tooWide()) && size > 48) {
		size -= 8;
		lines = wrap(semibold, name, size, OG_WIDTH - 2 * MARGIN);
	}
	const leading = size * 1.12;
	const last = OG_HEIGHT - MARGIN;
	const first = last - (lines.length - 1) * leading;
	const title = lines.map((line, i) => layout(semibold, line, size, MARGIN, first + i * leading).d).join("");
	const above = kind ? `<path fill="${MUTED}" d="${layout(regular, kind, 32, MARGIN, first - size * 0.95 - 20).d}"/>` : "";
	return png(frame(`${logo(MARGIN, 56, 48)}<rect y="140" width="${OG_WIDTH}" height="2" fill="${INK}"/>${above}<path fill="${INK}" d="${title}"/>`));
};
