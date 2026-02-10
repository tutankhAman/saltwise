import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";
import {
  conversations,
  drugPrices,
  drugs,
  messages,
  salts,
  scrapeJobs,
  searchHistory,
} from "./schema";

const schema = {
  conversations,
  messages,
  salts,
  drugs,
  drugPrices,
  scrapeJobs,
  searchHistory,
};

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
};

const client =
  globalForDb.client ??
  postgres(env.DATABASE_URL, {
    prepare: false,
  });
if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
