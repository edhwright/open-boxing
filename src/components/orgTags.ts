// World title names as highlighted text, e.g. "WBC and IBF": the segments OrgTags.svelte and the Astro pages draw. The
// titles that made a champion undisputed (gold, from src/undisputed.ts) are one continuous gold segment, commas
// included, then any others in their own tints.
export const tints: Record<string, string> = {
	IBU: "bg-ibu-tint",
	NYSAC: "bg-nysac-tint",
	WBA: "bg-wba-tint",
	WBAS: "bg-wba-tint",
	WBAR: "bg-wba-tint",
	WBC: "bg-wbc-tint",
	IBF: "bg-ibf-tint",
	WBO: "bg-wbo-tint",
	RING: "bg-ring-tint",
};

export function orgSegments(orgs: { abbreviation: string; short: string }[], gold: string[] = []) {
	const golden = orgs.filter((o) => gold.includes(o.abbreviation));
	const others = orgs.filter((o) => !gold.includes(o.abbreviation));
	const list = others.map((o) => ({ text: o.short, tint: tints[o.abbreviation] ?? "bg-wba-tint" }));
	if (golden.length) {
		const names = golden.map((o) => o.short);
		const text = others.length ? names.join(", ") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
		list.unshift({ text, tint: "bg-gold/40" });
	}
	return list.map((s, i) => ({ ...s, separator: i === list.length - 1 ? "" : i === list.length - 2 ? " and " : ", " }));
}

// the same, as an HTML string, for markup drawn outside a component, e.g. a timeline's tooltip
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const orgTagsHTML = (orgs: { abbreviation: string; short: string }[], gold: string[] = []) =>
	orgSegments(orgs, gold)
		.map((s) => `<span class="org whitespace-nowrap ${s.tint}">${escape(s.text)}</span>${s.separator}`)
		.join("");
