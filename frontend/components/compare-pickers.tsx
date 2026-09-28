"use client";

import { useRouter } from "next/navigation";
import { AssetPicker, type AssetOption } from "@/components/asset-picker";

interface ComparePickersProps {
  assets: AssetOption[];
  currentA: string | null;
  currentB: string | null;
}

export function ComparePickers({ assets, currentA, currentB }: ComparePickersProps) {
  const router = useRouter();

  function updateUrl(a: string | null, b: string | null) {
    const params = new URLSearchParams();
    if (a) params.set("a", a);
    if (b) params.set("b", b);
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <AssetPicker
        assets={assets}
        value={currentA}
        onChange={(id) => updateUrl(id, currentB)}
        placeholder="Select asset A…"
      />
      <AssetPicker
        assets={assets}
        value={currentB}
        onChange={(id) => updateUrl(currentA, id)}
        placeholder="Select asset B…"
      />
    </div>
  );
}
