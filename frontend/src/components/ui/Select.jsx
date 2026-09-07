/**
 * Reusable select field used across application forms.
 */

import { ChevronDown } from "lucide-react";


export default function Select({
  id,
  name,
  label,
  value,
  options = [],
  placeholder = "Select an option",
  error = "",
  disabled = false,
  required = false,
  className = "",
  onChange,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {label}

          {required && (
            <span className="ml-1 text-rose-500">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={onChange}
          className={`
            h-11
            w-full
            appearance-none
            rounded-xl
            border
            bg-white
            px-4
            pr-10
            text-sm
            text-slate-900
            shadow-sm
            transition
            duration-200
            focus:border-violet-500
            focus:ring-4
            focus:ring-violet-500/10
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-500
            ${
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200"
            }
          `}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="
            pointer-events-none
            absolute
            right-3.5
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}