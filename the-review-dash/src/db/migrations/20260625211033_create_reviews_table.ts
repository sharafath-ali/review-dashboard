import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("reviews", (table) => {
    table.increments("id").primary();
    table.text("review_id").notNullable().unique();
    table.text("asin").notNullable();
    table.text("product_name").notNullable();
    table.text("source").notNullable().defaultTo("amazon_in");
    table.text("author").notNullable();
    table.text("title").nullable();
    table.text("body").nullable();
    table.smallint("rating").notNullable();
    table.timestamp("reviewed_at", { useTz: true }).nullable();
    table.timestamp("ingested_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.boolean("verified").notNullable().defaultTo(false);
    table.integer("helpful_count").notNullable().defaultTo(0);
  });

  // Create custom indexes using raw SQL for exact sort optimization
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_at ON reviews (reviewed_at DESC NULLS LAST);
    CREATE INDEX IF NOT EXISTS idx_reviews_asin        ON reviews (asin);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("reviews");
}

