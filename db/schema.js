import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull(),
  url: text('url').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  status: text('status').default('uploaded').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});