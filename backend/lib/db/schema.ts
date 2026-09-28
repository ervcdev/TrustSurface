import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

export const ingestionRuns = pgTable("ingestion_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  assetsCaptured: integer("assets_captured"),
  status: text("status").notNull(), // "running" | "success" | "failed"
  error: text("error"),
});

export const assets = pgTable("assets", {
  id: text("id").primaryKey(), // rwa_id, stringified — keep this consistent everywhere
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(),
  hasTokens: boolean("has_tokens").notNull().default(false),
  metadata: jsonb("metadata"), // website/employees/founded/industry/cik/primaryExchange
  raw: jsonb("raw").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per asset PER RUN — accumulates a light price history for free.
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  assetId: text("asset_id").notNull().references(() => assets.id),
  ingestionRunId: integer("ingestion_run_id").notNull().references(() => ingestionRuns.id),
  priceUsd: numeric("price_usd"),
  marketCapUsd: numeric("market_cap_usd"),
  volume24hUsd: numeric("volume_24h_usd"),
  tradfiMarkets: jsonb("tradfi_markets"),
  raw: jsonb("raw").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per underlying token PER RUN — feeds dispersion/concentration/issuer-exposure.
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  assetId: text("asset_id").notNull().references(() => assets.id),
  ingestionRunId: integer("ingestion_run_id").notNull().references(() => ingestionRuns.id),
  cryptoId: integer("crypto_id"),
  symbol: text("symbol"),
  issuerId: text("issuer_id"),
  issuerName: text("issuer_name"),
  priceUsd: numeric("price_usd"),
  marketCapUsd: numeric("market_cap_usd"),
  volume24hUsd: numeric("volume_24h_usd"),
  raw: jsonb("raw").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});

// Restored per the AGENTS.md review — universe-level issuer data from
// /issuers/list, one row per issuer PER RUN. Not reconstructed from
// tokens[]; this is what makes issuer exposure independent of any single
// asset's own token count.
export const issuers = pgTable("issuers", {
  id: serial("id").primaryKey(),
  issuerId: text("issuer_id").notNull(),
  issuerName: text("issuer_name"),
  tokenCount: integer("token_count").notNull(),
  ingestionRunId: integer("ingestion_run_id").notNull().references(() => ingestionRuns.id),
  raw: jsonb("raw").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});
