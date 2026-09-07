/**
 * Reusable search field for customer and account searches.
 */

import {
  Search,
  X,
} from "lucide-react";


export default function SearchInput({
  value,
  placeholder = "Search...",
  disabled = false,
  onChange,
  onClear,
}) {
  return (
    <div className="relative w-full">
      <Search
        size={18}
        className="
          pointer-events-none
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-slate-400
        "
      />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="
          h-11
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          pl-11
          pr-11
          text-sm
          text-slate-900
          shadow-sm
          transition
          duration-200
          placeholder:text-slate-400
          focus:border-violet-500
          focus:ring-4
          focus:ring-violet-500/10
          disabled:cursor-not-allowed
          disabled:bg-slate-100
        "
      />

      {value && !disabled && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="
            absolute
            right-3
            top-1/2
            flex
            h-7
            w-7
            -translate-y-1/2
            items-center
            justify-center
            rounded-lg
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
            focus-visible:ring-2
            focus-visible:ring-violet-500
          "
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}