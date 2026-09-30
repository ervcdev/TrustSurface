import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// No import-time throw: during `next build` without a DATABASE_URL (CI,
// fresh clone, or a Vercel env var left empty) pages must still collect —
// they render the "no ingestion run" fallback. An empty or whitespace-only
// value counts as missing: neon() rejects "" as an invalid URL, so a blank
// dashboard field would otherwise fail the build. The placeholder passes
// neon()'s URL-format check but never connects successfully; queries fail
// at request time, which callers catch. At runtime with a real DB this is
// a no-op passthrough.
const configuredUrl = process.env.DATABASE_URL?.trim();
const connectionString =
  configuredUrl ||
  "postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/placeholder?sslmode=require";

// HTTP driver: no persistent connection — safe for serverless/edge functions.
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
