// Small drawings for the interactives' cards on the data page, made into SVG files at build time
// (data/thumbnails/[name].svg.ts), so the page holds an image for each rather than hundreds of elements. Each is in
// simple boxes, with head to head's two rows, a rule above each, and colour only where it matters (the bouts). The
// drawings are 400 by 225, the cards' shape, and positions below are percentages of the width and height.

import { schemeTableau10 } from "d3-scale-chromatic";

const W = 400;
const H = 225;
const INK = "#1a1a17";
const CREAM = "#fffff4";
const RULE = "#cbc3be";
const PALE = "#efede4";

const x = (percent: number) => +((percent * W) / 100).toFixed(2);
const y = (percent: number) => +((percent * H) / 100).toFixed(2);
// a rectangle, its outline drawn inside its edges as a border would be
const box = (left: number, top: number, width: number, height: number, attrs: string, stroke = 0) =>
	`<rect x="${+(left + stroke / 2).toFixed(2)}" y="${+(top + stroke / 2).toFixed(2)}" width="${+(width - stroke).toFixed(2)}" height="${+(height - stroke).toFixed(2)}" ${attrs}/>`;
const dot = (cx: number, cy: number, d: number, fill: string, stroke = 1.5) =>
	`<circle cx="${cx}" cy="${cy}" r="${(d - stroke) / 2}" fill="${fill}" stroke="${INK}" stroke-width="${stroke}"/>`;
// it fills the card edge to edge: inside its border a card is a hair off 16:9, which would otherwise leave slivers of
// page at the sides
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="${CREAM}"/>${body}</svg>`;

// the champion comparison: two world titles' rows, zoomed in on the years one passed between two boxers: other
// champions' reigns pale, the two boxers' outlined in ink, their bouts in the winner's colour, centred where one reign
// gives way to the next
// the first two boxers' colours on the comparison, from d3's Tableau 10 scheme
const boxerColours = { blue: schemeTableau10[0], orange: schemeTableau10[1] };
const compare: { bars: [number, number, "other" | "boxer"][]; dots: [number, keyof typeof boxerColours][] }[] = [
	{
		bars: [
			[-1.7, 10.1, "other"],
			[9.0, 51.57, "boxer"],
			[61.17, 21.14, "other"],
			[82.91, 18.79, "boxer"],
		],
		dots: [
			[8.7, "blue"],
			[43.48, "blue"],
			[60.87, "orange"],
			[82.61, "blue"],
		],
	},
	{
		bars: [
			[-1.7, 23.14, "other"],
			[22.04, 42.88, "boxer"],
			[65.52, 36.18, "other"],
		],
		dots: [
			[21.74, "blue"],
			[65.22, "orange"],
		],
	},
];

// the full timeline: two weight classes, a bold rule above each, its three world titles' lanes of reigns and bouts,
// edge to edge. Most reigns end on a bout, so most changes have one, and a few defences fall in between
const full: { bars: [number, number][]; dots: number[] }[][] = [
	[
		{ bars: [[-4.9, 34.2], [30.1, 35.9], [66.8, 39.8]], dots: [29.7, 66.4, 9.2, 80.6] },
		{ bars: [[-4.1, 32.6], [29.2, 26.9], [57.0, 49.6]], dots: [28.8, 56.6, 46.8] },
		{ bars: [[-3.1, 23.7], [21.4, 38.4], [60.6, 25.2], [86.6, 20.0]], dots: [21.0, 5.9, 60.2, 44.4, 73.6, 94.7] },
	],
	[
		{ bars: [[-1.8, 25.4], [24.5, 26.1], [51.4, 28.7], [81.0, 25.6]], dots: [24.1, 51.0, 69.9] },
		{ bars: [[-1.9, 34.2], [33.1, 24.0], [57.9, 28.2], [86.8, 19.8]], dots: [32.7, 57.5, 86.4] },
		{ bars: [[-2.5, 38.6], [36.9, 33.0], [70.7, 35.9]], dots: [36.5, 70.3] },
	],
];

// head to head: a row per boxer with their opponents as cards, a bout between the two outlined in bold
const h2h = [
	{ cards: ["#2f6db3", "#2f6db3", "#f08a24", "#2f6db3", "#2f6db3"], meeting: 2 },
	{ cards: ["#2f6db3", "#f08a24", "#2f6db3", "#2f6db3", "#bdbcb2"], meeting: 3 },
];

export const thumbnails: Record<string, string> = {
	timeline: svg(
		compare
			.map(
				(row, r) =>
					box(0, y(8 + r * 46), W, 1, `fill="${RULE}"`) +
					row.bars
						.map(([left, width, kind]) =>
							box(x(left), y(23 + r * 46), x(width), y(16), `rx="2" fill="${kind === "boxer" ? CREAM : PALE}" stroke="${kind === "boxer" ? INK : RULE}"`, 1),
						)
						.join("") +
					row.dots.map(([left, colour]) => dot(x(left), y(31 + r * 46), 14, boxerColours[colour], 1.75)).join(""),
			)
			.join(""),
	),

	"full-timeline": svg(
		full
			.map(
				(lanes, g) =>
					box(0, y(8 + g * 46), W, 2, `fill="${INK}"`) +
					lanes
						.map((lane, j) => {
							// three lanes of equal height fill the weight class, from its rule to the next
							const laneHeight = 46 / 3;
							const top = 8 + g * 46 + j * laneHeight;
							const mid = top + laneHeight / 2;
							return (
								(j > 0 ? box(0, y(top), W, 1, `fill="${RULE}"`) : "") +
								lane.bars.map(([left, width]) => box(x(left), y(mid - 3.2), x(width), y(6.4), `rx="1.5" fill="${PALE}" stroke="${INK}" stroke-opacity="0.18"`, 1)).join("") +
								lane.dots.map((left) => dot(x(left), y(mid), 10, "#2f6db3")).join("")
							);
						})
						.join(""),
			)
			.join(""),
	),

	"head-to-head": svg(
		`<defs><linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="${CREAM}" stop-opacity="0"/><stop offset="1" stop-color="${CREAM}"/></linearGradient></defs>` +
			h2h
				.map((row, r) => {
					const top = 14 + r * 46;
					return (
						box(0, y(8 + r * 46), W, 1, `fill="${RULE}"`) +
						box(x(5), y(16 + r * 46), x(17), y(5), `fill="${INK}"`) +
						box(x(5), y(24 + r * 46), x(12), y(3.5), `fill="${INK}" fill-opacity="0.35"`) +
						row.cards
							.map((colour, c) => {
								const left = x(28 + c * 17);
								const cw = x(15);
								const ch = y(34);
								const meeting = c === row.meeting;
								return (
									box(left, y(top), cw, ch, `fill="${CREAM}" stroke="${meeting ? INK : RULE}" stroke-width="${meeting ? 1.5 : 1}"`, meeting ? 1.5 : 1) +
									dot(+(left + cw * 0.1 + 4).toFixed(2), +(y(top) + ch * 0.12 + 4).toFixed(2), 8, colour, 1) +
									box(left + cw * 0.1, y(top) + ch * 0.34, cw * 0.7, ch * 0.09, `fill="${INK}" fill-opacity="0.7"`) +
									box(left + cw * 0.1, y(top) + ch * 0.62, cw * 0.5, ch * 0.07, `fill="${INK}" fill-opacity="0.25"`) +
									box(left + cw * 0.1, y(top) + ch * 0.78, cw * 0.4, ch * 0.07, `fill="${INK}" fill-opacity="0.25"`)
								);
							})
							.join("")
					);
				})
				.join("") +
			box(x(88), 0, x(12), H, `fill="url(#fade)"`),
	),
};
