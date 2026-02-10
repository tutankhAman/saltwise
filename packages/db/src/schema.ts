import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

/**
 * Conversations table — tracks chat sessions between users and Salty.
 * Each conversation belongs to a single authenticated user.
 */
export const conversations = pgTable(
  "saltwise_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("conversations_user_id_idx").on(table.userId)]
);

/**
 * Messages table — stores individual messages within a conversation.
 * Role is either 'user' or 'assistant'.
 */
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
