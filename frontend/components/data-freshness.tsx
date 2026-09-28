import { db } from "@/lib/db";
import { ingestionRuns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function DataFreshness() {
  let lastRun = null;
  try {
    lastRun = await db
      .select({
        finishedAt: ingestionRuns.finishedAt,
        status: ingestionRuns.status,
        assetsCaptured: ingestionRuns.assetsCaptured,
      })
      .from(ingestionRuns)
      .where(eq(ingestionRuns.status, "success"))
      .orderBy(desc(ingestionRuns.finishedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  } catch {
    // Build-time without DATABASE_URL, or DB unreachable — render fallback.
    lastRun = null;
  }

  if (!lastRun?.finishedAt) {
    return (
      <span className="text-xs font-mono" style={{ color: "var(--flag)" }}>
        No ingestion run completed yet
      </span>
    );
  }

  const formatted = new Date(lastRun.finishedAt).toUTCString().replace("GMT", "UTC");

  return (
    <span className="text-xs font-mono" style={{ color: "var(--ink-tertiary)" }}>
      Data as of {formatted}
      {lastRun.assetsCaptured ? ` · ${lastRun.assetsCaptured} assets tracked` : ""}
    </span>
  );
}
