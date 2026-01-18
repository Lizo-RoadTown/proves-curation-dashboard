/**
 * SearchBar - Mission Control search input
 *
 * Dark theme with electric blue focus state.
 */

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search the library...",
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3 text-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
