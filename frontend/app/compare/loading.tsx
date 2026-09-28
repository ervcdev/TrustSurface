import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceCardSkeleton } from "@/components/evidence-card";

export default function CompareLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 mb-6">
          <EvidenceCardSkeleton />
          <EvidenceCardSkeleton />
        </div>
      ))}
    </div>
  );
}
