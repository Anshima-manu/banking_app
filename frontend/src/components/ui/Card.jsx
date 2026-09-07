/**
 * Reusable content card for dashboard and detail pages.
 */

export default function Card({
  children,
  className = "",
  padding = true,
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-slate-200/70
        bg-white
        shadow-sm
        ${padding ? "p-5" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}