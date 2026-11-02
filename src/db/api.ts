import { eq, desc, inArray, and, or, type SQL, type InferSelectModel } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from './client';
import { Champion, Title, Reign, Bout, BoutTitle, Location, Reference } from './schema';
import type { WeightClass } from "./types";

export async function getAllChampions() {
    return await db.select().from(Champion).orderBy(Champion.champion_id).all();
}

export async function getChampion(id: number) {
    const champion = await db.select().from(Champion).where(eq(Champion.champion_id, id)).get();
    if (!champion) throw new Error(`Champion not found with id: ${id}`);
    return champion;
}

export async function getAllTitles() {
    return await db.select().from(Title).orderBy(Title.title_id).all();
}

export async function getAllReferences() {
    return await db.select().from(Reference).orderBy(Reference.reference_id).all();
}

/// Reigns

// reigns are ordered by start date, with reign_id breaking ties
function selectReigns() {
    return db
        .select()
        .from(Reign)
        .innerJoin(Champion, eq(Reign.champion_id, Champion.champion_id))
        .innerJoin(Title, eq(Reign.title_id, Title.title_id));
}

export async function getAllReigns() {
    return await selectReigns()
        .orderBy(Reign.begins, Reign.reign_id)
        .all();
}

export async function getTitleReigns(titleId: number) {
    return await selectReigns()
        .where(eq(Reign.title_id, titleId))
        .orderBy(Reign.begins, Reign.reign_id)
        .all();
}

export async function getWeightClassReigns(weightClass: WeightClass) {
    return await selectReigns()
        .where(eq(Title.weight_class, weightClass))
        .orderBy(Reign.begins, Reign.reign_id)
        .all();
}

export async function getChampionReigns(championId: number) {
    return await selectReigns()
        .where(eq(Reign.champion_id, championId))
        .orderBy(Reign.begins, Reign.reign_id)
        .all();
}

export async function getLatestTitleReign(titleId: number) {
    return await selectReigns()
        .where(eq(Reign.title_id, titleId))
        .orderBy(desc(Reign.begins), Reign.reign_id)
        .get();
}

export async function getLatestReigns(limit: number) {
    return await selectReigns()
        .orderBy(desc(Reign.begins), Reign.reign_id)
        .limit(limit)
        .all();
}

/// Bouts

const ChampionA = alias(Champion, "ChampionA");
const ChampionB = alias(Champion, "ChampionB");

// one row per bout per title, ordered by date (bout_id breaking ties) and then by the order the titles are listed in bouts.csv
async function selectBouts(where?: SQL) {
    return await db
        .select()
        .from(Bout)
        .leftJoin(ChampionA, eq(Bout.boxer_a_id, ChampionA.champion_id))
        .leftJoin(ChampionB, eq(Bout.boxer_b_id, ChampionB.champion_id))
        .leftJoin(Location, eq(Bout.location_id, Location.location_id))
        .innerJoin(BoutTitle, eq(Bout.bout_id, BoutTitle.bout_id))
        .innerJoin(Title, eq(BoutTitle.title_id, Title.title_id))
        .where(where)
        .orderBy(Bout.date, Bout.bout_id, BoutTitle.position)
        .all();
}

type BoutQueryReturn = Awaited<ReturnType<typeof selectBouts>>[number];

export type BoutWithTitles = InferSelectModel<typeof Bout> & {
    ChampionA: BoutQueryReturn['ChampionA'];
    ChampionB: BoutQueryReturn['ChampionB'];
    Location: BoutQueryReturn['Location'];
    // weight_lb is the title's weight limit at the time of the bout
    titles: (InferSelectModel<typeof Title> & { weight_lb: string })[];
};

function groupTitlesByBout(bouts: BoutQueryReturn[]) {
    const boutsMap = new Map<number, BoutWithTitles>();

    for (const row of bouts) {
        const boutId = row.Bout.bout_id;

        // If this is the first time seeing this bout, initialize it
        if (!boutsMap.has(boutId)) {
            boutsMap.set(boutId, {
                ...row.Bout,
                ChampionA: row.ChampionA,
                ChampionB: row.ChampionB,
                Location: row.Location,
                titles: [],
            });
        }

        // Add this title to the bout's titles array
        boutsMap.get(boutId)!.titles.push({ ...row.Title, weight_lb: row.BoutTitle.weight_lb });
    }

    return Array.from(boutsMap.values());
}

// bouts that include at least one title matching the condition (all of each bout's titles are still returned)
function hasTitle(condition: SQL) {
    return inArray(
        Bout.bout_id,
        db
            .select({ bout_id: BoutTitle.bout_id })
            .from(BoutTitle)
            .innerJoin(Title, eq(BoutTitle.title_id, Title.title_id))
            .where(condition)
    );
}

const isScheduled = eq(Bout.status, "SCHEDULED");

export async function getAllBouts() {
    return groupTitlesByBout(await selectBouts());
}

export async function getBout(boutId: number) {
    const bout = groupTitlesByBout(await selectBouts(eq(Bout.bout_id, boutId)))[0];
    if (!bout) throw new Error(`Bout not found with id: ${boutId}`);
    return bout;
}

export async function getScheduledBouts() {
    return groupTitlesByBout(await selectBouts(isScheduled));
}

export async function getTitleBouts(titleId: number) {
    return groupTitlesByBout(await selectBouts(hasTitle(eq(Title.title_id, titleId))));
}

export async function getScheduledTitleBouts(titleId: number) {
    return groupTitlesByBout(await selectBouts(and(isScheduled, hasTitle(eq(Title.title_id, titleId)))));
}

// a bout belongs to a weight class if one of its titles does, as a few bouts' weight_class differs from their titles'
export async function getWeightClassBouts(weightClass: WeightClass) {
    return groupTitlesByBout(await selectBouts(hasTitle(eq(Title.weight_class, weightClass))));
}

export async function getScheduledWeightClassBouts(weightClass: WeightClass) {
    return groupTitlesByBout(await selectBouts(and(isScheduled, hasTitle(eq(Title.weight_class, weightClass)))));
}

export async function getNextScheduledWeightClassBout(weightClass: WeightClass) {
    const bouts = await getScheduledWeightClassBouts(weightClass);
    return bouts.length > 0 ? bouts[0] : null;
}

export async function getChampionBouts(championId: number) {
    return groupTitlesByBout(await selectBouts(or(eq(Bout.boxer_a_id, championId), eq(Bout.boxer_b_id, championId))));
}
