/**
 * Reusable heading for sections inside application pages.
 */

export default function SectionHeader({
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
        ${className}
      `}
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}