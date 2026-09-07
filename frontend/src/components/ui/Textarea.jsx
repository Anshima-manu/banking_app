/**
 * Reusable multiline input used across application forms.
 */

export default function Textarea({
  id,
  name,
  label,
  value,
  placeholder = "",
  error = "",
  disabled = false,
  required = false,
  rows = 4,
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

      <textarea
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        onChange={onChange}
        className={`
          w-full
          resize-y
          rounded-xl
          border
          bg-white
          px-4
          py-3
          text-sm
          leading-6
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
          disabled:text-slate-500
          ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
              : "border-slate-200"
          }
        `}
        {...props}
      />

      {error && (
        <p className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}