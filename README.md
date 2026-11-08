# Open Boxing

This repo contains all the source code and content needed to build [openboxing.org](https://openboxing.org/).

openboxing.org is built with [Astro](https://astro.build/) as a static website.

## Development

```shell
# Installs dependencies
npm install

# Starts local dev server at localhost:3000
npm run dev

# Builds production site to ./dist/
npm run build
```

## Next steps

### Data

- Add location data to bouts.
- Add references to bouts and reigns. Every bout and reign should cite a published source, such as a fight report from the time or the announcement of a vacancy.
- Add missing rankings from the TBRB.
- Add a CSV of weight limit changes: each title's old and new limit, and the date the organisation changed it, with a reference.

### Content

- Add all The Boxing Blade issues.
- Add more public domain news articles to support the data.

## WBA

The WBA's world title split in two in the 2000s. The original title became WBA Super, and the WBA added a secondary title, WBA Regular. At some weight classes the WBA later went back to one champion, so WBA Super became the WBA title again.

- **CSV files:** WBA, WBA Super (`WBAS`) and WBA Regular (`WBAR`) are separate titles in `titles.csv`. A reign ends and a new one begins when the title changes between WBA and WBA Super, and each bout lists the exact title on the line.
- **Website:** the WBA page for a weight class (`/heavyweight/wba/`) shows the WBA's main line: the NBA, WBA and WBA Super titles, in one timeline. Every change between WBA and WBA Super is marked, and every reign and bout is still labelled WBA or WBA Super. WBA Regular has its own page. Old `/…/wbas/` addresses redirect to `/…/wba/`.
- **API:** follows the CSV files, so WBA, WBA Super and WBA Regular each have their own endpoints, e.g. `/api/heavyweight/wbas/reigns/index.json`.

## References

The goal is to support every data point (each bout, reign and vacancy) with a published source, such as a fight report from the time. References are in `references.csv`, and the website shows them with "Show references" on the timelines.

## Licence

The code is under the MIT licence (see `LICENSE.md`).
