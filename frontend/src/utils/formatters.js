/**
 * Shared formatting helpers for banking application values.
 */


/**
 * Format a numeric value as Indian Rupees.
 */
export function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}


/**
 * Format a date into a readable Indian date format.
 */
export function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}


/**
 * Format a date and time into a readable format.
 */
export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  let normalizedValue = value;

  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
  if(!hasTimezone){
    normalizedValue = `${value}Z`;
  }
  const date = new Date(normalizedValue);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


/**
 * Hide all except the last four digits of an account number.
 */
export function maskAccountNumber(accountNumber) {
  if (!accountNumber) {
    return "—";
  }

  const value = String(accountNumber);

  if (value.length <= 4) {
    return value;
  }

  return `•••• ${value.slice(-4)}`;
}