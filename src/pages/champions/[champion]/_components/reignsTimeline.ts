// A champion page's "World title reigns and bouts": the model for the shared zoomable timeline (src/timeline). A lane
// for every world title the champion held or fought for, heaviest weight class first; reigns as bars in the title's
// tint, bouts as circles coloured by the result, and the champion's age under each date on the axis.
import dayjs from "dayjs";
import { marksNbaToWba, nbaToWba, type Model } from "../../../../timeline/timeline";
import { orgTagsHTML, tints } from "../../../../components/orgTags";
import { orgOrder, weightOrder, type ChampionBout, type ChampionReign, type Result } from "./champion";

// blue won, orange lost (a pair that reads apart with any colour vision), grey a draw or no contest
const results: Record<Result, string> = { won: "#2f6db3", lost: "#f08a24", draw: "#bdbcb2", nc: "#bdbcb2", scheduled: "var(--color-cream)" };
const tint = (org: string) => `var(--color-${(tints[org] ?? "bg-wba-tint").slice(3)})`;
const slug = (s: string) => s.replaceAll(" ", "-").toLowerCase();
// WBA Super is on the WBA's page
const titlePage = (org: string, weight: string) => `/${slug(weight)}/${slug(org === "WBAS" ? "WBA" : org)}/`;
const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const longDate = (iso: string) => `${ordinal(dayjs(iso).date())} ${dayjs(iso).format("MMM YYYY")}`;
const key = (background: string, label: string, dashed = false) =>
	`<span><i aria-hidden="true" class="tl-key" style="background:${background}${dashed ? ";border-style:dashed" : ""}"></i>${label}</span>`;

export function reignsTimeline(reigns: ChampionReign[], bouts: ChampionBout[], born: string, today: string): Model {
	const dates = [...reigns.map((r) => r.begins), ...bouts.map((b) => b.date)];
	const first = Math.min(...dates.map((d) => dayjs(d).year()));
	// whole years, so the span opens and closes on a year's tick; through this year while a reign carries on
	const last = Math.max(...dates.map((d) => dayjs(d).year()), ...reigns.map((r) => dayjs(r.ends ?? today).year())) + 1;
	const span = last - first;
	const step = [1, 2, 5, 10, 20].find((s) => span / s <= 6) ?? 20;

	const lanes = new Map<string, { org: ChampionReign["org"]; weight: string }>();
	for (const r of reigns) lanes.set(`${r.org.abbreviation}:${r.weight}`, { org: r.org, weight: r.weight });
	for (const b of bouts) for (const t of b.titles) lanes.set(`${t.org.abbreviation}:${t.weight}`, { org: t.org, weight: t.weight });
	const sorted = [...lanes.values()].sort(
		(a, b) => weightOrder.indexOf(a.weight) - weightOrder.indexOf(b.weight) || orgOrder.indexOf(a.org.abbreviation) - orgOrder.indexOf(b.org.abbreviation),
	);

	return {
		full: [`${first}-01-01`, `${last}-01-01`],
		today,
		born,
		laneHeight: 48,
		labelWidth: 232,
		phoneLabelWidth: 112,
		heading: `<h2 id="reigns" class="font-heading text-[28px] leading-8 font-semibold">World title reigns and bouts</h2>`,
		overviewYears: Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => Math.ceil(first / step) * step + i * step).filter((y) => y >= first && y <= last),
		markers: marksNbaToWba(reigns.map((r) => ({ org: r.org.abbreviation, begins: r.begins }))) ? [nbaToWba] : [],
		legend: [
			key(results.won, "Won"),
			key(results.lost, "Lost"),
			key(results.draw, "Drawn or no contest"),
			...(bouts.some((b) => b.result === "scheduled") ? [key(results.scheduled, "Scheduled", true)] : []),
		].join(""),
		lanes: sorted.map(({ org, weight }, i) => {
			const firstOfWeight = i === 0 || sorted[i - 1].weight !== weight;
			return {
				// the weight class beside its first title (above it on phones), then the title, linking to its page
				label: `<span class="flex min-w-0 items-center gap-2 max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-0.5"><span class="w-[104px] shrink-0 text-xs leading-4 font-medium text-ink-soft max-[760px]:w-auto">${firstOfWeight ? weight : ""}</span><a href="${titlePage(org.abbreviation, weight)}" class="org whitespace-nowrap ${tints[org.abbreviation] ?? "bg-wba-tint"}">${org.short}</a></span>`,
				heavy: firstOfWeight,
				bars: reigns
					.filter((r) => r.org.abbreviation === org.abbreviation && r.weight === weight)
					.map((r) => ({ start: r.begins, end: r.ends, background: tint(org.abbreviation), mini: "#a39e92" })),
				dots: bouts
					.filter((b) => b.titles.some((t) => t.org.abbreviation === org.abbreviation && t.weight === weight))
					.map((b) => ({
						date: b.date,
						background: results[b.result],
						dashed: b.result === "scheduled",
						tip: {
							date: longDate(b.date),
							text: b.text,
							detail: `${b.result === "scheduled" ? "Scheduled · " : ""}${b.weight} · ${orgTagsHTML(
								b.titles.map((t) => t.org),
								b.gold,
							)}`,
						},
					})),
			};
		}),
	};
}
