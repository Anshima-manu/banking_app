/**
 * Displays a reusable empty state when no records are available.
 */

import { Inbox } from "lucide-react";

import Button from "./Button";


export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There is nothing to display yet.",
  actionLabel,
  onAction,
}) {
  return (
    <div
      className="
        flex
        min-h-64
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-slate-200
        bg-slate-50/70
        px-6
        py-10
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-gradient-to-br
          from-violet-100
          to-indigo-100
          text-violet-600
        "
      >
        <Icon size={24} />
      </div>

      <h3
        className="
          mt-4
          text-base
          font-semibold
          text-slate-900
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1
          max-w-sm
          text-sm
          leading-6
          text-slate-500
        "
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          className="mt-5"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}