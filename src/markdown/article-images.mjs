// A Markdown plugin for the transcribed articles' images (./images/<file> beside each article): Astro optimises them,
// and this gives each a set of widths for the reading column, about 680px wide (the full screen less its margins on
// phones), so a high-resolution scan is only sent at the size a screen can show. AVIF at quality 50: on these scans
// about half the size of WebP, and under half the original JPEGs
const widths = [480, 800, 1360];
const sizes = "(max-width: 760px) calc(100vw - 32px), 680px";

export default function articleImages() {
	return {
		name: "article-images",
		element: {
			filter: ["img"],
			visit(node, ctx) {
				// the fallback src at the largest width, not the scan's full size (one is 6380px)
				ctx.setProperty(node, "width", widths.at(-1));
				ctx.setProperty(node, "widths", widths);
				ctx.setProperty(node, "sizes", sizes);
				ctx.setProperty(node, "format", "avif");
				ctx.setProperty(node, "quality", 50);
			},
		},
	};
}
