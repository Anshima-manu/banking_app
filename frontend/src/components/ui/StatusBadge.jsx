/**
 * Displays account and transaction statuses with consistent colors.
 */

import {
  accountStatusStyles,
  transactionTypeStyles,
} from "../../utils/theme";


export default function StatusBadge({
  value,
  type = "status",
}) {
  if (!value) {
    return null;
  }

  const normalizedValue = String(value).toUpperCase();

  const styles =
    type === "transaction"
      ? transactionTypeStyles[normalizedValue]
      : accountStatusStyles[normalizedValue];

  const fallbackStyle =
    "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  const label = normalizedValue
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2.5
        py-1
        text-xs
        font-semibold
        ${styles || fallbackStyle}
      `}
    >
      {label}
    </span>
  );
}