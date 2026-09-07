/**
 * Reusable modal for forms and banking actions.
 */

import { X } from "lucide-react";


export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-lg",
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-950/60
        p-4
        backdrop-blur-sm
      "
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        className={`
          w-full
          ${maxWidth}
          max-h-[90vh]
          overflow-y-auto
          rounded-3xl
          border
          border-white/10
          bg-white
          shadow-2xl
        `}
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            border-b
            border-slate-100
            px-6
            py-5
          "
        >
          <div>
            <h2
              id="modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              focus-visible:ring-2
              focus-visible:ring-violet-500
            "
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}