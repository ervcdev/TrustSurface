"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AssetOption {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
}

interface AssetPickerProps {
  assets: AssetOption[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function AssetPicker({
  assets,
  value,
  onChange,
  placeholder = "Select asset…",
}: AssetPickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = assets.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-mono text-sm"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--surface-3)",
            color: selected ? "var(--ink-primary)" : "var(--ink-tertiary)",
          }}
        >
          {selected
            ? `${selected.symbol} — ${selected.name}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        style={{ background: "var(--surface-1)", border: "1px solid var(--surface-3)" }}
      >
        <Command>
          <CommandInput
            placeholder="Search by symbol or name…"
            className="font-mono text-sm"
          />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-sm font-mono"
              style={{ color: "var(--ink-tertiary)" }}>
              No asset found.
            </CommandEmpty>
            <CommandGroup>
              {assets.map((asset) => (
                <CommandItem
                  key={asset.id}
                  value={`${asset.symbol} ${asset.name}`}
                  onSelect={() => {
                    onChange(asset.id);
                    setOpen(false);
                  }}
                  className="font-mono text-sm cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === asset.id ? "opacity-100" : "opacity-0"
                    )}
                    style={{ color: "var(--accent)" }}
                  />
                  <span style={{ color: "var(--ink-primary)" }}>
                    {asset.symbol}
                  </span>
                  <span
                    className="ml-2 truncate"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {asset.name}
                  </span>
                  <span
                    className="ml-auto text-xs"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    {asset.assetType}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
