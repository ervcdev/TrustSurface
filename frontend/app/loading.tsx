import { Skeleton } from "@/components/ui/skeleton";

// Auto-wraps app/page.tsx in a Suspense boundary — no extra wiring needed.
// This is the single highest-leverage polish move per current UX research:
// loading state, button feedback, and validation are "the three touchpoints
// that get you 80% of the perceived-quality effect."
export default function ExploreLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      {/* Placeholder for CoverageSummary so nothing shifts when it lands */}
      <div
        className="grid grid-cols-2 sm:grid-cols-5 mb-8 rounded"
        style={{ border: "1px solid var(--surface-3)", background: "var(--surface-1)" }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-16 mb-3" />
            <Skeleton className="h-1 w-full mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="rounded border overflow-hidden" style={{ borderColor: "var(--surface-3)" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3"
            style={{ borderBottom: i < 7 ? "1px solid var(--surface-2)" : "none" }}
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
