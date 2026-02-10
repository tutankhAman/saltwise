import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "./env";
import { conversations, messages } from "./schema";

const schema = { conversations, messages };

const globalForDb = globalThis as unknown as {
  client: SQL | undefined;
};

const client =
  globalForDb.client ??
  new SQL(env.DATABASE_URL, {
    prepare: false,
  });
if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
