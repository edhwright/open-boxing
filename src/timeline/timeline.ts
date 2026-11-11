// A zoomable timeline of world title reigns and bouts: a lane per row (an organisation, or a world title), bars for
// reigns and dots for bouts, a date axis, and an overview of the whole span underneath with the view as a window.
//
// figureHTML() draws it for a given date range, so Astro can build the starting view into the page. mount() then
// takes over in the browser: d3.zoom on the plot (drag to move, pinch or ctrl-scroll to zoom, sideways scroll to pan),
// d3.brushX on the overview, d3.scaleTime's ticks on the axis, and buttons, all sharing the zoom's one state.
import { scaleTime } from "d3-scale";
import { pointer, select } from "d3-selection";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { brushX, type D3BrushEvent } from "d3-brush";

export interface Tip {
	date: string;
	text: string;
	// HTML, so the world titles can show in their tints; escape any names in it
	detail: string;
}

export interface Bar {
	start: string;
	// null while it carries on
	end: string | null;
	background: string;
	// a stronger outline, e.g. a boxer added to a comparison
	strong?: boolean;
	label?: string;
	labelColour?: string;
	// the overview's colour for it
	mini?: string;
	// details on hover or tap; without them the bar is only a mark
	tip?: Tip;
	// the champion: hovering a reign fades everyone else's
	who?: number;
}

export interface Dot {
	date: string;
	background: string;
	dashed?: boolean;
	tip: Tip;
	// the champions in the bout
	who?: number[];
}

export interface Lane {
	// the label column's HTML for this lane
	label: string;
	// a heavier rule above it, e.g. the first title in a weight class
	heavy?: boolean;
	bars: Bar[];
	dots: Dot[];
	// moments in this lane alone, e.g. a weight class's WBA title becoming WBA Super: a dashed line down the lane,
	// with its details on hover or tap, as a figure of many weight classes has no room for every note
	markers?: (Marker & { tip: Tip })[];
}

export interface Marker {
	date: string;
	label: string;
}

export interface Model {
	// the whole span, as YYYY-MM-DD
	full: [string, string];
	today: string;
	lanes: Lane[];
	laneHeight: number;
	phoneLaneHeight?: number;
	// a long figure: its controls stick to the top of the screen, its axis and overview to the bottom
	sticky?: boolean;
	// the label column's width in pixels (narrower on phones)
	labelWidth: number;
	phoneLabelWidth?: number;
	// the overview's decade (or other) marks
	overviewYears: number[];
	// a heading for the toolbar's left, as HTML, with the range under it
	heading?: string;
	// moments marked with a line down the lanes and a note above them, e.g. the NBA becoming the WBA
	markers?: Marker[];
	// the legend under the overview, as HTML
	legend?: string;
	// a champion's date of birth: the axis then shows their age under each date
	born?: string;
}

// the National Boxing Association renamed itself the World Boxing Association: its world titles carry on, in the WBA's
// lane, so the timelines mark the day. Shown where the WBA lane has a reign from before it
export const nbaToWba: Marker = { date: "1962-08-23", label: "The NBA becomes the WBA" };
export const marksNbaToWba = (reigns: { org: string; begins: string }[]) => reigns.some((r) => r.org === "WBA" && r.begins < nbaToWba.date);

const DAY = 86400000;
const MIN_SPAN = 180 * DAY;
const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (t: number) => {
	const d = new Date(t);
	return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const span = (model: Model): [number, number] => [ms(model.full[0]), ms(model.full[1])];
const full = span;
const endOf = (model: Model, bar: Bar) => (bar.end ? ms(bar.end) : ms(model.today));

// a bar's label: the whole name if it fits, else the surname, else nothing
function fit(label: string | undefined, px: number) {
	if (!label) return "";
	if (px > label.length * 6.5 + 12) return label;
	const last = label.split(" ").at(-1) ?? "";
	return px > last.length * 6.5 + 12 ? last : "";
}

// one lane's bars and dots for a date range, positioned in percentages of the plot
function trackHTML(model: Model, lane: Lane, l: number, domain: [number, number], width: number) {
	const x = (t: number) => ((t - domain[0]) / (domain[1] - domain[0])) * 100;
	let html = "";
	lane.markers?.forEach((m, i) => {
		const t = ms(m.date);
		if (t < domain[0] || t > domain[1]) return;
		html += `<span class="tl-lane-marker" data-mark="${l}:${i}" aria-label="${esc(m.label)}" style="left:${x(t).toFixed(3)}%"></span>`;
	});
	lane.bars.forEach((bar, i) => {
		const a = ms(bar.start);
		const b = endOf(model, bar);
		if (b < domain[0] || a > domain[1]) return;
		const left = Math.max(-5, x(a));
		const right = Math.min(105, x(b));
		// a reign that began before the view: its name starts at the view's edge
		const hidden = Math.max(0, -left);
		const label = fit(bar.label, ((Math.min(100, right) - Math.max(0, left)) / 100) * width);
		html += `<span class="tl-bar${bar.strong ? " tl-strong" : ""}${bar.end ? "" : " tl-open"}"${bar.tip ? ` data-bar="${l}:${i}"` : ""}${bar.who ? ` data-who="${bar.who}"` : ""} style="left:${left.toFixed(3)}%;width:${Math.max(0.15, right - left).toFixed(3)}%;background:${bar.background}">${
			label ? `<span style="color:${bar.labelColour ?? "var(--color-ink)"}${hidden ? `;margin-left:${((hidden / 100) * width).toFixed(1)}px` : ""}">${esc(label)}</span>` : ""
		}</span>`;
	});
	lane.dots.forEach((dot, i) => {
		const t = ms(dot.date);
		if (t < domain[0] || t > domain[1]) return;
		html += `<i class="tl-dot${dot.dashed ? " tl-dashed" : ""}" data-dot="${l}:${i}"${dot.who?.length ? ` data-who="${dot.who.join(" ")}"` : ""} style="left:${x(t).toFixed(3)}%;background:${dot.background}"></i>`;
	});
	return html;
}

// Each note sits beside its line, in the room between its neighbours' lines and notes. It moves to the other side of
// its line if that clears the note beside it; if neither side has room for all of it, it takes the side with more and
// is cut short with an ellipsis, showing in full on hover. Only a note with almost no room is hidden (its line stays).
// The latest note is placed first, so it is the one that keeps most of its room
function declutter(markers: HTMLElement | null) {
	if (!markers) return;
	const bounds = markers.getBoundingClientRect();
	const notes = [...markers.querySelectorAll<HTMLElement>(".tl-marker-note")];
	const lines = notes.map((n) => (n.previousElementSibling as HTMLElement).getBoundingClientRect().left);
	const gap = 8;
	let limit = bounds.right + 1;
	for (let i = notes.length - 1; i >= 0; i--) {
		const note = notes[i];
		const line = lines[i];
		note.classList.remove("tl-marker-hidden", "tl-marker-cut");
		note.style.maxWidth = "";
		// on the left, a note reaches back to the line before (that line's note can still sit left of it)
		const floor = i > 0 ? lines[i - 1] + gap : bounds.left;
		const fits = () => {
			const box = note.getBoundingClientRect();
			return box.right <= limit && box.left >= floor - (note.classList.contains("tl-marker-left") ? 0 : Infinity);
		};
		if (!fits()) {
			note.classList.toggle("tl-marker-left");
			if (!fits()) {
				const right = limit - line;
				const left = line <= limit ? line - floor : 0;
				const onLeft = left > right;
				note.classList.toggle("tl-marker-left", onLeft);
				const room = Math.floor(onLeft ? left : right);
				if (room < 40) {
					note.classList.remove("tl-marker-left");
					note.classList.add("tl-marker-hidden");
					continue;
				}
				note.classList.add("tl-marker-cut");
				note.style.maxWidth = `${room}px`;
			}
		}
		limit = note.getBoundingClientRect().left - gap;
	}
}

// the markers: a line down the plot for each, with its note in the row above the lanes
function markersHTML(model: Model, domain: [number, number]) {
	const x = (t: number) => ((t - domain[0]) / (domain[1] - domain[0])) * 100;
	return [...(model.markers ?? [])]
		.sort((a, b) => a.date.localeCompare(b.date))
		.filter((m) => ms(m.date) >= domain[0] && ms(m.date) <= domain[1])
		.map((m) => {
			const left = x(ms(m.date));
			return `<span class="tl-marker" style="left:${left.toFixed(3)}%"></span><span class="tl-marker-note${left > 70 ? " tl-marker-left" : ""}" style="left:${left.toFixed(3)}%">${esc(m.label)}</span>`;
		})
		.join("");
}

// a boxer's age in whole years on a tick's date (the scale's ticks fall in local time)
function ageOn(born: string, t: Date) {
	const [y, m, d] = born.split("-").map(Number);
	return t.getFullYear() - y - (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d) ? 1 : 0);
}

// d3's tick choice and multi-scale format for the range: decades, years, then months as you zoom in. With a date of
// birth, each label has the age under it
function axisHTML(domain: [number, number], width: number, born?: string) {
	const sx = scaleTime().domain(domain).range([0, 100]);
	// years, then short months, then days: "1962", "Oct", "Oct 15" (the scale's ticks fall in local time)
	const format = (t: Date) =>
		t.getMonth() === 0 && t.getDate() === 1 ? String(t.getFullYear()) : t.getDate() === 1 ? months[t.getMonth()] : `${months[t.getMonth()]} ${t.getDate()}`;
	// the age shows on the first tick and then only where it has gone up, so zoomed in to months it reads once a year
	let lastAge = -1;
	return sx
		.ticks(Math.max(3, Math.floor(width / 80)))
		.map((t) => {
			const left = sx(t);
			// labels at either end stay inside the plot
			const shift = left < 3 ? "0" : left > 97 ? "-100%" : "-50%";
			const align = left < 3 ? "left" : left > 97 ? "right" : "center";
			const years = born ? ageOn(born, t) : -1;
			const age = born && years !== lastAge ? `<span class="tl-tick-age">age ${years}</span>` : "";
			lastAge = years;
			return `<span class="tl-tick" style="left:${left.toFixed(3)}%"></span><span class="tl-tick-label" style="left:${left.toFixed(3)}%;transform:translateX(${shift});text-align:${align}">${format(t)}${age}</span>`;
		})
		.join("");
}

const overviewHeight = (model: Model) => Math.max(28, 8 + Math.round(model.lanes.length * Math.min(8, Math.max(3, Math.floor(60 / model.lanes.length)), 52 / model.lanes.length)));

// the overview: every reign as a thin line on its lane's row, across the whole span
function overviewHTML(model: Model) {
	const [f0, f1] = span(model);
	// at least 28px tall, the lines centred in it
	// a line per lane, as thin as a fraction of a pixel when there are many
	const gap = Math.min(8, Math.max(3, Math.floor(60 / model.lanes.length)), 52 / model.lanes.length);
	const height = overviewHeight(model);
	const top = (height - model.lanes.length * gap) / 2 + 1;
	const x = (t: number) => ((t - f0) / (f1 - f0)) * 1000;
	const lines = model.lanes
		.flatMap((lane, l) =>
			lane.bars.map(
				(bar) =>
					`<rect x="${x(ms(bar.start)).toFixed(1)}" y="${(top + l * gap).toFixed(2)}" width="${Math.max(1, x(endOf(model, bar)) - x(ms(bar.start))).toFixed(1)}" height="${gap >= 4 ? gap - 2 : (gap * 0.75).toFixed(2)}" fill="${bar.mini ?? "#a39e92"}"/>`,
			),
		)
		.join("");
	const years = model.overviewYears
		.map((y, i, all) => {
			const left = ((Date.UTC(y, 0, 1) - f0) / (f1 - f0)) * 100;
			const shift = i === 0 && left < 3 ? "0" : i === all.length - 1 && left > 97 ? "-100%" : "-50%";
			return `<span style="left:${left.toFixed(2)}%;transform:translateX(${shift})">${y}</span>`;
		})
		.join("");
	return `<div class="tl-overview" data-overview style="height:${height}px"><svg aria-hidden="true" viewBox="0 0 1000 ${height}" preserveAspectRatio="none">${lines}</svg><svg class="tl-brush" data-brush aria-hidden="true"></svg></div><div class="tl-overview-years">${years}</div>`;
}

const icon = (path: string) =>
	`<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${path}"></path></svg>`;

// the whole figure, drawn for a date range; `width` is the plot's width in pixels as far as it is known
export function figureHTML(model: Model, domain: [string, string], width = 1100) {
	const d: [number, number] = [ms(domain[0]), ms(domain[1])];
	const labels = model.lanes.map((lane) => `<div class="tl-label${lane.heavy ? " tl-heavy" : ""}">${lane.label}</div>`).join("");
	const tracks = model.lanes.map((lane, l) => `<div class="tl-track${lane.heavy ? " tl-heavy" : ""}">${trackHTML(model, lane, l, d, width)}</div>`).join("");
	const years = Array.from(
		{ length: new Date(full(model)[1]).getUTCFullYear() - new Date(full(model)[0]).getUTCFullYear() + 1 },
		(_, i) => new Date(full(model)[0]).getUTCFullYear() + i,
	);
	// the picker starts on this year, or on the last year anything happened if that is earlier (a title no longer
	// contested), and stays on what was picked as the view moves
	const latest = model.lanes.flatMap((lane) => [...lane.bars.map((b) => b.end ?? model.today), ...lane.dots.map((dot) => dot.date)]).sort().at(-1) ?? model.today;
	const thisYear = Math.min(Number(model.today.slice(0, 4)), Number(latest.slice(0, 4)), years.at(-1)!);
	return `<div class="tl${model.sticky ? " tl-sticky" : ""}${model.born ? " tl-ages" : ""}${d[0] > full(model)[0] + DAY ? " tl-scrolled" : ""}" data-timeline style="--tl-lane:${model.laneHeight}px;--tl-lane-phone:${model.phoneLaneHeight ?? model.laneHeight}px;--tl-overview:${overviewHeight(model) + 36}px;--tl-label:${model.labelWidth}px;--tl-label-phone:${model.phoneLabelWidth ?? model.labelWidth}px">
<div class="tl-toolbar">
	<div>${model.heading ?? ""}<p class="tl-range" data-range aria-live="polite">${monthYear(d[0])} – ${monthYear(d[1])}</p></div>
	<div role="group" aria-label="Move through time" class="tl-buttons">
		<label class="tl-jump"><span>Go to</span><select data-jump>${years.map((y) => `<option${y === thisYear ? " selected" : ""}>${y}</option>`).join("")}</select></label>
		<button type="button" class="zoom-button" data-act="start" aria-label="Start">${icon("M7 6v12M17 6l-6 6 6 6")}</button>
		<button type="button" class="zoom-button" data-act="earlier" aria-label="Earlier">${icon("M15 6l-6 6 6 6")}</button>
		<button type="button" class="zoom-button" data-act="later" aria-label="Later">${icon("M9 6l6 6-6 6")}</button>
		<button type="button" class="zoom-button" data-act="end" aria-label="End">${icon("M17 6v12M7 6l6 6-6 6")}</button>
		<button type="button" class="zoom-button" data-act="out" aria-label="Zoom out">${icon("M5 12h14")}</button>
		<button type="button" class="zoom-button" data-act="in" aria-label="Zoom in">${icon("M5 12h14M12 5v14")}</button>
		<button type="button" class="tl-link" data-act="all">All years</button>
	</div>
</div>
<div class="tl-figure">
	<div class="tl-labels">${model.markers?.length ? `<div class="tl-notes-pad"></div>` : ""}${labels}<div class="tl-axis-pad"></div></div>
	<div class="tl-plot" data-plot>${model.markers?.length ? `<div class="tl-notes"></div><div class="tl-markers" data-markers>${markersHTML(model, d)}</div>` : ""}${tracks}<div class="tl-axis" data-axis>${axisHTML(d, width, model.born)}</div></div>
	<div class="tl-tip" data-tip role="tooltip" hidden><p class="tl-tip-date"></p><p class="tl-tip-text"></p><p class="tl-tip-detail"></p></div>
</div>
<div class="tl-overview-row">
	<span></span>
	<div>${overviewHTML(model)}</div>
</div>
${model.legend ? `<p class="tl-legend">${model.legend}</p>` : ""}
</div>`;
}

// takes over a figure figureHTML() drew, starting at `initial`, telling `onview` the range shown as it changes;
// returns a function that stops it
export function mount(root: HTMLElement, model: Model, initial: [string, string], onview?: (domain: [string, string]) => void) {
	const figure = root.querySelector<HTMLElement>("[data-timeline]")!;
	const plot = figure.querySelector<HTMLElement>("[data-plot]")!;
	const tracks = [...plot.querySelectorAll<HTMLElement>(".tl-track")];
	const axis = figure.querySelector<HTMLElement>("[data-axis]")!;
	const range = figure.querySelector<HTMLElement>("[data-range]")!;
	const tip = figure.querySelector<HTMLElement>("[data-tip]")!;
	const overview = figure.querySelector<HTMLElement>("[data-overview]")!;
	const brushSvg = figure.querySelector<SVGSVGElement>("[data-brush]")!;
	const jump = figure.querySelector<HTMLSelectElement>("[data-jump]")!;
	const markers = figure.querySelector<HTMLElement>("[data-markers]");
	const full = span(model);

	let width = plot.clientWidth || 1000;
	let base = scaleTime().domain(full).range([0, width]);
	let domain: [number, number] = [ms(initial[0]), ms(initial[1])];
	let syncing = false;
	declutter(markers);

	// drawing waits for the next frame, so a burst of zoom events draws once
	let frame = 0;
	const draw = () => {
		if (!frame) frame = requestAnimationFrame(render);
	};
	const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
	const render = () => {
		frame = 0;
		onview?.([iso(domain[0]), iso(domain[1])]);
		model.lanes.forEach((lane, l) => (tracks[l].innerHTML = trackHTML(model, lane, l, domain, width)));
		axis.innerHTML = axisHTML(domain, width, model.born);
		if (markers) markers.innerHTML = markersHTML(model, domain);
		declutter(markers);
		range.textContent = `${monthYear(domain[0])} – ${monthYear(domain[1])}`;
		// once the view leaves the start, the plot runs under the labels' shadow
		figure.classList.toggle("tl-scrolled", domain[0] > full[0] + DAY);
		hideTip();
	};

	// the zoom: its transform is the one state that the plot, the overview's window and the buttons all follow
	const behaviour: ZoomBehavior<HTMLElement, unknown> = zoom<HTMLElement, unknown>()
		.scaleExtent([1, (full[1] - full[0]) / MIN_SPAN])
		// a mouse wheel scrolls the page unless ctrl or cmd is held (as a trackpad pinch does); a drag moves the view
		.filter((e: Event) => (e.type === "wheel" ? (e as WheelEvent).ctrlKey || (e as WheelEvent).metaKey : !(e as MouseEvent).button))
		.on("zoom", (e: D3ZoomEvent<HTMLElement, unknown>) => {
			// a drag or pinch takes over from a glide
			if (e.sourceEvent) stopGlide();
			domain = e.transform.rescaleX(base).domain().map(Number) as [number, number];
			draw();
			if (!syncing) moveBrush();
		});
	const plotSel = select(plot).call(behaviour);
	plotSel.on("dblclick.zoom", null);
	// a vertical swipe still scrolls the page; sideways swipes and pinches are the zoom's
	plot.style.touchAction = "pan-y";
	const transformFor = (d0: number, d1: number): ZoomTransform => {
		const span = Math.max(MIN_SPAN, Math.min(full[1] - full[0], d1 - d0));
		d0 = Math.max(full[0], Math.min(d0, full[1] - span));
		const k = width / (base(d0 + span) - base(d0));
		return zoomIdentity.translate(-base(d0) * k, 0).scale(k);
	};
	const setDomain = (d0: number, d1: number) => plotSel.call(behaviour.transform, transformFor(d0, d1));

	// the buttons and the year picker glide to their range: the zoom's transform eased from where it is, frame by frame
	// (d3's own transitions would do the same, at the cost of another module). Instant with reduced motion
	let glide = 0;
	const stopGlide = () => {
		cancelAnimationFrame(glide);
		glide = 0;
	};
	const glideTo = (d0: number, d1: number) => {
		stopGlide();
		const to = transformFor(d0, d1).rescaleX(base).domain().map(Number);
		const from = domain;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setDomain(to[0], to[1]);
		const started = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - started) / 380);
			// ease out: quick to start, settling gently
			const e = 1 - (1 - p) ** 3;
			setDomain(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e);
			glide = p < 1 ? requestAnimationFrame(step) : 0;
		};
		glide = requestAnimationFrame(step);
	};

	// a sideways scroll (a trackpad swipe, or shift and the wheel) moves the view
	const onWheel = (e: WheelEvent) => {
		if (e.ctrlKey || e.metaKey) return;
		stopGlide();
		const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
		if (!dx) return;
		e.preventDefault();
		const perPx = (domain[1] - domain[0]) / width;
		setDomain(domain[0] + dx * perPx, domain[1] + dx * perPx);
	};
	plot.addEventListener("wheel", onWheel, { passive: false });

	// the overview's window: d3.brushX, kept in step with the zoom both ways
	const brush = brushX<unknown>().on("brush end", (e: D3BrushEvent<unknown>) => {
		if (syncing || !e.sourceEvent) return;
		stopGlide();
		const selection = e.selection as [number, number] | null;
		const ox = overviewScale();
		if (selection) {
			syncing = true;
			setDomain(ox.invert(selection[0]).getTime(), ox.invert(selection[1]).getTime());
			syncing = false;
			// the window may be narrower than the zoom allows: settle it on what is shown
			if (e.type === "end") moveBrush();
		} else if (e.type === "end") {
			// a click outside the window: move the window there
			const [px] = pointer(e.sourceEvent, overview);
			const middle = ox.invert(px).getTime();
			const half = (domain[1] - domain[0]) / 2;
			glideTo(middle - half, middle + half);
		}
	});
	const brushSel = select(brushSvg).append("g").call(brush);
	const overviewScale = () => scaleTime().domain(full).range([0, overview.clientWidth]);
	const moveBrush = () => {
		syncing = true;
		const ox = overviewScale();
		brushSel.call(brush.move, [ox(domain[0]), ox(domain[1])]);
		syncing = false;
	};
	const measure = () => {
		// a sticky axis sits just above the sticky overview
		figure.style.setProperty("--tl-overview", `${figure.querySelector<HTMLElement>(".tl-overview-row")!.offsetHeight}px`);
		width = plot.clientWidth || width;
		base = scaleTime().domain(full).range([0, width]);
		const height = plot.clientHeight;
		behaviour
			.extent([
				[0, 0],
				[width, height],
			])
			.translateExtent([
				[0, 0],
				[width, height],
			]);
		brushSvg.setAttribute("width", String(overview.clientWidth));
		brushSvg.setAttribute("height", String(overview.clientHeight));
		brush.extent([
			[0, 0],
			[overview.clientWidth, overview.clientHeight],
		]);
		brushSel.call(brush);
	};

	// the buttons
	const actions: Record<string, () => void> = {
		earlier: () => glideTo(domain[0] - (domain[1] - domain[0]) / 2, domain[1] - (domain[1] - domain[0]) / 2),
		later: () => glideTo(domain[0] + (domain[1] - domain[0]) / 2, domain[1] + (domain[1] - domain[0]) / 2),
		in: () => glideTo(domain[0] + (domain[1] - domain[0]) / 4, domain[1] - (domain[1] - domain[0]) / 4),
		out: () => glideTo(domain[0] - (domain[1] - domain[0]) / 2, domain[1] + (domain[1] - domain[0]) / 2),
		// to the start or the end, keeping the zoom
		start: () => glideTo(full[0], full[0] + (domain[1] - domain[0])),
		end: () => glideTo(full[1] - (domain[1] - domain[0]), full[1]),
		all: () => glideTo(full[0], full[1]),
	};
	const onClick = (e: MouseEvent) => {
		const button = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
		if (button) actions[button.dataset.act!]?.();
	};
	figure.addEventListener("click", onClick);
	// the year picker centres the view on that year, keeping the zoom
	const onJump = () => {
		const middle = Date.UTC(Number(jump.value), 6, 1);
		const half = (domain[1] - domain[0]) / 2;
		glideTo(middle - half, middle + half);
	};
	jump.addEventListener("change", onJump);

	// details on hover, focus or tap: below the mark in the upper lanes, above it in the lower ones, kept inside the
	// figure sideways. Hovering a reign fades every other champion's reigns and bouts
	let current: HTMLElement | null = null;
	function showTip(mark: HTMLElement, clientX?: number) {
		// fade in only when opening; from one mark to the next it moves straight across
		const opening = tip.hidden;
		release();
		current = mark;
		const [l, i] = (mark.dataset.bar ?? mark.dataset.dot ?? mark.dataset.mark)!.split(":").map(Number);
		const isBar = mark.dataset.bar !== undefined;
		const item = isBar ? model.lanes[l].bars[i] : mark.dataset.dot !== undefined ? model.lanes[l].dots[i] : model.lanes[l].markers![i];
		tip.querySelector(".tl-tip-date")!.textContent = item.tip!.date;
		tip.querySelector(".tl-tip-text")!.textContent = item.tip!.text;
		tip.querySelector(".tl-tip-detail")!.innerHTML = item.tip!.detail;
		if (isBar && (item as Bar).who) {
			const who = String((item as Bar).who);
			for (const m of plot.querySelectorAll<HTMLElement>("[data-who]")) if (!m.dataset.who!.split(" ").includes(who)) m.classList.add("tl-faded");
		}
		if (mark.dataset.dot !== undefined) mark.classList.add("tl-on");
		const box = figure.querySelector(".tl-figure")!.getBoundingClientRect();
		const r = mark.getBoundingClientRect();
		const x = Math.max(0, Math.min(box.width, (clientX && r.width > 24 ? clientX : r.left + r.width / 2) - box.left));
		const below = l < model.lanes.length / 2 || model.lanes.length === 1;
		tip.hidden = false;
		if (opening) {
			tip.classList.remove("tl-tip-fade");
			void tip.offsetWidth;
			tip.classList.add("tl-tip-fade");
		}
		// starting at the mark near the left, ending at it near the right, centred on it in between; then nudged to stay
		// 8px inside the screen, as on a phone the figure is often narrower than the tip's natural place
		const w = tip.offsetWidth;
		const left = x < 150 ? x - 12 : x > box.width - 150 ? x - w + 12 : x - w / 2;
		const screen = document.documentElement.clientWidth;
		tip.style.left = `${Math.max(8 - box.left, Math.min(screen - 8 - box.left - w, left))}px`;
		tip.style.top = below ? `${r.bottom - box.top + 8}px` : `${r.top - box.top - 8}px`;
		tip.style.transform = below ? "none" : "translateY(-100%)";
	}
	// clears the highlight of the mark whose details are showing
	function release() {
		if (!current) return;
		current.classList.remove("tl-on");
		current = null;
		for (const m of plot.querySelectorAll(".tl-faded")) m.classList.remove("tl-faded");
	}
	function hideTip() {
		release();
		tip.hidden = true;
	}
	const markOf = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>("[data-bar], [data-dot], [data-mark]");
	// leaving a mark hides its details after a moment, long enough to move onto them, e.g. to copy the text; they
	// stay while the pointer is over them, and go a moment after it leaves
	let hiding = 0;
	const hideSoon = () => {
		clearTimeout(hiding);
		hiding = window.setTimeout(hideTip, 250);
	};
	const keep = () => clearTimeout(hiding);
	const onOver = (e: PointerEvent) => {
		const mark = markOf(e);
		if (!mark) return;
		keep();
		if (mark !== current) showTip(mark, e.clientX);
	};
	const onOut = (e: PointerEvent) => {
		const mark = markOf(e);
		if (mark && !mark.contains(e.relatedTarget as Node) && e.pointerType === "mouse") hideSoon();
	};
	const onTipOut = (e: PointerEvent) => {
		if (!tip.contains(e.relatedTarget as Node) && e.pointerType === "mouse") hideSoon();
	};
	// a tap shows the details; a tap anywhere else hides them, except on the details themselves
	const onTap = (e: MouseEvent) => {
		const mark = markOf(e);
		if (mark && plot.contains(mark)) showTip(mark, e.clientX);
		else if (!tip.contains(e.target as Node)) hideTip();
	};
	plot.addEventListener("pointerover", onOver);
	plot.addEventListener("pointerout", onOut);
	tip.addEventListener("pointerenter", keep);
	tip.addEventListener("pointerleave", onTipOut);
	document.addEventListener("click", onTap);

	const resize = new ResizeObserver(() => {
		const keep = domain;
		measure();
		setDomain(keep[0], keep[1]);
	});
	resize.observe(plot);
	measure();
	setDomain(domain[0], domain[1]);

	return () => {
		cancelAnimationFrame(frame);
		stopGlide();
		resize.disconnect();
		plotSel.on(".zoom", null);
		plot.removeEventListener("wheel", onWheel);
		figure.removeEventListener("click", onClick);
		jump.removeEventListener("change", onJump);
		plot.removeEventListener("pointerover", onOver);
		plot.removeEventListener("pointerout", onOut);
		tip.removeEventListener("pointerenter", keep);
		tip.removeEventListener("pointerleave", onTipOut);
		clearTimeout(hiding);
		document.removeEventListener("click", onTap);
	};
}
