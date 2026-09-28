import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceCardSkeleton } from "@/components/evidence-card";

// Matches the real asymmetric layout (2 large + 3 medium) so nothing
// reflows/jumps when the real content swaps in.
export default function AssetProfileLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-4 w-56 mb-1" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <EvidenceCardSkeleton size="lg" />
        <EvidenceCardSkeleton size="lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <EvidenceCardSkeleton />
        <EvidenceCardSkeleton />
        <EvidenceCardSkeleton />
      </div>
    </div>
  );
}
