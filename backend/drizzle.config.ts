import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle.config.ts runs outside Next.js (via CLI), so .env.local is not
// loaded automatically — dotenv handles it here. Monorepo: CLI runs with
// CWD=backend/, env file lives at repo root.
config({ path: "../.env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set — copy .env.example to .env.local and fill it in."
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
