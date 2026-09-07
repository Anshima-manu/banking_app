/**
 * Reusable heading section for application pages.
 */

export default function PageHeader({
  title,
  description,
  action,
  children,
}) {
  return (
    <div
      className="
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div>
        <h1
          className="
            text-2xl
            font-bold
            tracking-tight
            text-slate-950
            sm:text-3xl
          "
        >
          {title}
        </h1>

        {description && (
          <p
            className="
              mt-1.5
              max-w-2xl
              text-sm
              leading-6
              text-slate-500
            "
          >
            {description}
          </p>
        )}

        {children}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}