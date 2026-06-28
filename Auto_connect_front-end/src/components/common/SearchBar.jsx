import { Search } from "lucide-react";

function SearchBar({ value, onChange, placeholder = "Rechercher..." }) {
  return (
    <label className="focus-ring flex items-center gap-3 rounded-2xl border border-softBlue/20 bg-white px-4 py-3">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default SearchBar;
