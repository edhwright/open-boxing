// The sitemap's last-modified dates, so search engines know which pages an update changed. A page's date is the
// latest thing in the data that it shows: a reign beginning or ending, or a bout taking place, up to the day of the
// build. Champion, weight class and world title pages get their own; the home and champions pages the latest of all.
// Other pages (articles, the API, the interactives) change rarely and get no date.
import fs from "node:fs";
import { csvParse } from "d3-dsv";

const read = (name) => csvParse(fs.readFileSync(new URL(`../../data/${name}`, import.meta.url), "utf8"));
const slug = (s) => s.replaceAll(" ", "-").toLowerCase();
// WBA Super is on the WBA's page
const titlePath = (key) => {
	const [org, weight] = key.split("-");
	return `/${slug(weight)}/${slug(org === "WBAS" ? "WBA" : org)}/`;
};
const weightPath = (key) => `/${slug(key.split("-")[1])}/`;

export function sitemapDates(today = new Date().toISOString().slice(0, 10)) {
	const dates = new Map();
	const note = (path, date) => {
		if (!date || date > today) return;
		if (!dates.has(path) || dates.get(path) < date) dates.set(path, date);
	};
	const everywhere = (date) => ["/", "/champions/"].forEach((path) => note(path, date));

	for (const reign of read("reigns.csv"))
		for (const date of [reign.begins, reign.ends]) {
			note(`/champions/${reign.champion_id}/`, date);
			note(titlePath(reign.title), date);
			note(weightPath(reign.title), date);
			everywhere(date);
		}
	for (const bout of read("bouts.csv")) {
		if (bout.status !== "FINISHED") continue;
		for (const id of [bout.boxer_a_champion_id, bout.boxer_b_champion_id]) if (id) note(`/champions/${id}/`, bout.date);
		for (const key of bout.titles.split(",")) {
			note(titlePath(key), bout.date);
			note(weightPath(key), bout.date);
		}
		everywhere(bout.date);
	}
	return dates;
}
