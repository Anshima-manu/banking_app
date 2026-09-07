/**
 * Displays API or form-level error messages consistently.
 */

import { AlertCircle } from "lucide-react";


export default function ErrorMessage({
  message,
  className = "",
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`
        flex
        items-start
        gap-3
        rounded-xl
        border
        border-rose-200
        bg-rose-50
        px-4
        py-3
        text-sm
        text-rose-700
        ${className}
      `}
    >
      <AlertCircle
        size={18}
        className="mt-0.5 shrink-0"
      />

      <p className="leading-5">
        {message}
      </p>
    </div>
  );
}