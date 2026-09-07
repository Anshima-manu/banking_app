/**
 * Reusable loading indicator for pages and asynchronous actions.
 */

export default function LoadingSpinner({
  size = "md",
  label = "Loading...",
  fullScreen = false,
}) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-11 w-11 border-4",
  };

  const spinnerSize = sizes[size] ?? sizes.md;

  const content = (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        gap-3
      "
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          ${spinnerSize}
          animate-spin
          rounded-full
          border-violet-200
          border-t-violet-600
        `}
      />

      {label && (
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-50
        "
      >
        {content}
      </div>
    );
  }

  return content;
}