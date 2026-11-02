import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { readMigrationFiles } from "drizzle-orm/migrator";
import * as schema from "./schema";
import seed from "./seed";

// In-memory database, rebuilt from the CSVs in /data whenever this module is first imported
// (i.e. once per `astro build` / `astro dev` process), replacing what @astrojs/db used to do.
const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys = ON");

// drizzle-orm's stable releases don't have a node:sqlite driver yet, so bridge it with sqlite-proxy
export const db = drizzle(
	async (sql, params, method) => {
		const statement = sqlite.prepare(sql);
		const values = params as SQLInputValue[];

		if (method === "run") {
			statement.run(...values);
			return { rows: [] };
		}

		// drizzle maps result columns by position, so it needs rows as arrays
		statement.setReturnArrays(true);
		if (method === "get") {
			// node's types don't reflect setReturnArrays, and drizzle's types don't allow for no row (undefined),
			// although it handles it at runtime
			return { rows: statement.get(...values) as unknown as unknown[] };
		}
		return { rows: statement.all(...values) as unknown[] };
	},
	{ schema },
);

// tables come from the single init migration drizzle-kit generates fresh from ./schema.ts (`npm run db:generate`)
for (const migration of readMigrationFiles({ migrationsFolder: "./src/db/migrations" })) {
	for (const statement of migration.sql) sqlite.exec(statement);
}

sqlite.exec("BEGIN");
await seed(db);
sqlite.exec("COMMIT");
