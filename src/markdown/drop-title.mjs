// A Markdown plugin for the transcribed articles: drops the article's headline, the heading it opens with, because
// the page already shows the article's title above it. The transcriptions keep the headline as it was printed.
export default function dropTitle() {
	return {
		name: "drop-title",
		before(root, ctx) {
			const first = root.children.find((node) => node.type === "element");
			if (first && (first.tagName === "h1" || first.tagName === "h2")) ctx.removeNode(first);
		},
	};
}
