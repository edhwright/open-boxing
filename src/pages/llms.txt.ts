// llms.txt (see llmstxt.org): a plain guide to the site for language models and other tools, made at build time so
// its links follow the site. Open Boxing is happy for its content to be read, scraped and shared.
import type { APIRoute } from "astro";
import { getAllTitles } from "../db";
import { slugify, weightClasses } from "../utils";

const site = "https://openboxing.org";
// the raw files, ready to download
const github = "https://raw.githubusercontent.com/edhwright/open-boxing/main/data";
const files = [
	["champions.csv", "every world champion"],
	["reigns.csv", "every world title reign: the champion, the world title and the dates"],
	["bouts.csv", "every world title bout: the boxers, the result and the world titles at stake"],
	["titles.csv", "every world title: the organisation, the weight class and whether it is still contested"],
	["rankings.csv", "The Ring's annual ratings and the Transnational Boxing Rankings Board's monthly rankings"],
	["undisputed-periods.csv", "every period a champion was undisputed, and the world titles that counted at the time (being added)"],
	["references.csv", "published sources for the data (being added)"],
];

export const GET: APIRoute = async () => {
	const titles = await getAllTitles();
	const orgs = [...new Map(titles.map((t) => [t.org.name.abbreviation, t.org.name.full])).entries()];
	const text = `# Open Boxing

> Open source world championship boxing data since 1911: every world title bout, reign and champion from the IBU, NYSAC, WBA, WBC, IBF, WBO and The Ring, plus an archive of public domain newspaper and magazine articles. You're welcome to read, scrape and share it. The data is licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/): credit Open Boxing.

Each world title has its own page, at /{weight class}/{organisation}/. The WBA Super world title carried on the WBA world title, so both are on the WBA page; WBA Regular, the WBA's secondary title, has its own page. Organisation codes, as in page and API addresses: ${orgs.map(([abbreviation, full]) => `${slugify(abbreviation)} (${full})`).join(", ")}.

## Data

- [Data page](${site}/data/): the interactives, every weight class and world title, and the CSV files
${files.map(([name, about]) => `- [${name}](${github}/${name}): ${about}`).join("\n")}

## API

- [API documentation](${site}/api/): static JSON, no key needed
- [Every world title bout](${site}/api/bouts/all/index.json)
- [Every world title reign](${site}/api/reigns/all/index.json)
- [Every world champion](${site}/api/champions/all/index.json)

## Pages

- [Home](${site}/): current world champions, upcoming world title bouts and recent world title changes
- [Current world champions](${site}/champions/)
${weightClasses.map((wc) => `- [${wc.class}](${site}/${slugify(wc.class)}/)`).join("\n")}

## Articles

- [Articles](${site}/articles/): public domain newspaper and magazine articles, transcribed
- [The Boxing Blade](${site}/articles/the-boxing-blade/): a weekly boxing publication that ran from 1919 to 1926

## Optional

- [GitHub](https://github.com/edhwright/open-boxing): the source code, data and issues
`;
	return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
