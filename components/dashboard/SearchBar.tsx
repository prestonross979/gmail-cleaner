"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1">
      <label htmlFor="sender-search" className="sr-only">
        Search by sender, email, or domain
      </label>
      <input
        id="sender-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by sender, email, or domain"
        className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-foreground ring-1 ring-border placeholder:text-foreground/40 focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
