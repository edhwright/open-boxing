// A published source for a bout or a world title change, as the pages show it: a news report, linked (often to an
// archived copy). Used by the weight class, world title and champion timelines; imports nothing that reads the database.
import dayjs from "dayjs";
import type { Reference } from "./types";

export interface PageReference {
	headline: string;
	author: string | null;
	publication: string;
	date: string;
	// the date of what it reports, e.g. the day a world title was vacated
	eventDate: string;
	url: string;
}

export const pageReference = (r: Reference): PageReference => ({
	headline: r.title,
	author: r.author,
	publication: r.publication,
	date: r.publicationDate,
	eventDate: r.eventDate,
	url: r.link.url,
});

// whether a reign's source goes with its beginning or its end: whichever its date is nearer (a source can date it a
// few days apart)
export const nearerEnd = (ref: PageReference, begins: string, ends: string | null) =>
	!ends || Math.abs(dayjs(ref.eventDate).diff(begins, "day")) <= Math.abs(dayjs(ref.eventDate).diff(ends, "day")) ? "begins" : "ends";
