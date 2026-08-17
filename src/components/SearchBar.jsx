import { Search } from "lucide-react";

export default function SearchBar({ placeholder = "Search...", value, onChange, maxLength = 100, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className="input pl-9"
      />
    </div>
  );
}
