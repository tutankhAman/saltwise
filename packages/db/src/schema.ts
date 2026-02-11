import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const conversations = pgTable(
  "saltwise_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("conversations_user_id_idx").on(table.userId)]
);

export const messages = pgTable(
  "saltwise_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("messages_conversation_id_idx").on(table.conversationId)]
);

export const salts = pgTable(
  "saltwise_salts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("salts_name_idx").on(table.name)]
);

export const drugs = pgTable(
  "saltwise_drugs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandName: text("brand_name").notNull(),
    saltComposition: text("salt_composition"),
    saltId: uuid("salt_id").references(() => salts.id),
    strength: text("strength"),
    form: text("form"),
    manufacturer: text("manufacturer"),
    imageUrl: text("image_url"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("drugs_brand_name_idx").on(table.brandName),
    unique("drugs_brand_name_manufacturer_unique").on(
      table.brandName,
      table.manufacturer
    ),
  ]
);

export const drugPrices = pgTable(
  "saltwise_drug_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    drugId: uuid("drug_id")
      .notNull()
      .references(() => drugs.id, { onDelete: "cascade" }),
    pharmacyName: text("pharmacy_name").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }),
    url: text("url"),
    inStock: boolean("in_stock").default(true),
    lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("drug_prices_drug_id_idx").on(table.drugId),
    unique("drug_prices_drug_pharmacy_unique").on(
      table.drugId,
      table.pharmacyName
    ),
  ]
);

export const scrapeJobStatusEnum = pgEnum("scrape_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const scrapeJobs = pgTable(
  "saltwise_scrape_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    query: text("query").notNull(),
    status: text("status", {
      enum: ["pending", "processing", "completed", "failed"],
    })
      .default("pending")
      .notNull(),
    resultCount: numeric("result_count").default("0"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("scrape_jobs_status_idx").on(table.status)]
);

export const searchHistory = pgTable(
  "saltwise_search_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    query: text("query").notNull(),
    resultDrugId: uuid("result_drug_id").references(() => drugs.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("search_history_user_id_idx").on(table.userId)]
);

export const drugAiCache = pgTable(
  "saltwise_drug_ai_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    drugId: uuid("drug_id")
      .notNull()
      .references(() => drugs.id, { onDelete: "cascade" }),
    cacheType: text("cache_type", {
      enum: ["safety_info", "interactions", "ai_explanation"],
    }).notNull(),
    content: jsonb("content").notNull(),
    model: text("model").notNull(),
    saltComposition: text("salt_composition").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("drug_ai_cache_drug_id_idx").on(table.drugId),
    unique("drug_ai_cache_drug_type_unique").on(table.drugId, table.cacheType),
  ]
);
