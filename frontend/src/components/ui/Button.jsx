/**
 * Reusable button used across the banking application.
 */

const variantStyles = {
  primary:
    "bg-gradient-to-r from-fuchsia-600 via-purple-700 to-rose-500 text-white shadow-md shadow-fuchsia-500/20 hover:from-fuchsia-700 hover:via-purple-800 hover:to-rose-700 hover:shadow-lg hover:shadow-fuchsia-500/25",

  secondary:
    "border border-fuchsia-200 bg-gradient-to-r from-white to-fuchsia-100 text-fuchsia-800 shadow-sm hover:border-fuchsia-300 hover:from-fuchsia-100 hover:to-rose-100",

  dark:
    "bg-gradient-to-r from-zinc-950 via-purple-950 to-fuchsia-950 text-white shadow-md shadow-purple-950/20 hover:from-zinc-900 hover:via-purple-900 hover:to-fuchsia-900",

  danger:
    "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/20 hover:from-rose-700 hover:to-red-600",

  ghost:
    "bg-transparent text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-700",
};


const sizeStyles = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};


export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  onClick,
}) {
  const variantClass =
    variantStyles[variant] ?? variantStyles.primary;

  const sizeClass =
    sizeStyles[size] ?? sizeStyles.md;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        font-semibold
        transition-all
        duration-200
        focus-visible:ring-2
        focus-visible:ring-violet-500
        focus-visible:ring-offset-2
        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variantClass}
        ${sizeClass}
        ${className}
      `}
    >
      {children}
    </button>
  );
}