/**
 * Reusable form input used across the banking application.
 */

export default function Input({
  id,
  name,
  label,
  type = "text",
  value,
  placeholder = "",
  error = "",
  disabled = false,
  required = false,
  autoComplete = "off",
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

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        onChange={onChange}
        className={`
          h-11
          w-full
          rounded-xl
          border
          bg-white
          px-4
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
