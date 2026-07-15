"use client";

export type SortKey = "count" | "name" | "recent";

interface SortControlsProps {
  sortKey: SortKey;
  onChange: (key: SortKey) => void;
}

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "count", label: "Most emails" },
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Alphabetical" },
];

export function SortControls({ sortKey, onChange }: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sender-sort" className="text-sm text-foreground/60">
        Sort
      </label>
      <select
        id="sender-sort"
        value={sortKey}
        onChange={(event) => onChange(event.target.value as SortKey)}
        className="rounded-xl bg-surface px-3 py-2.5 text-sm text-foreground ring-1 ring-border focus:ring-2 focus:ring-accent"
      >
        {OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
