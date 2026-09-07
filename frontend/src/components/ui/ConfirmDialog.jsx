/**
 * Confirmation dialog for sensitive or destructive actions.
 */

import { AlertTriangle } from "lucide-react";

import Button from "./Button";
import Modal from "./Modal";


export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      maxWidth="max-w-md"
    >
      <div className="flex gap-4">
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-rose-50
            text-rose-600
          "
        >
          <AlertTriangle size={21} />
        </div>

        <div>
          <p className="text-sm leading-6 text-slate-600">
            {message}
          </p>
        </div>
      </div>

      <div
        className="
          mt-6
          flex
          items-center
          justify-end
          gap-3
        "
      >
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>

        <Button
          variant={variant}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Processing..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}