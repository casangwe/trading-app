// src/func/formatters.js

/* ============================
   Date Formatting
============================ */

// Accepts: "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss", Date, etc.
const toYmdString = (input) => {
  if (!input) return "";

  // Date object
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return "";
    return input.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  // Anything else -> string
  const s = String(input);

  // If it's ISO datetime, keep date part only
  const datePart = s.includes("T") ? s.split("T")[0] : s;

  // Must look like YYYY-MM-DD
  if (!datePart.includes("-")) return "";

  const parts = datePart.split("-");
  if (parts.length < 3) return "";

  const [year, month, day] = parts;
  if (!year || !month || !day) return "";

  return `${year}-${month}-${day}`;
};

export const formatDate = (dateInput) => {
  const ymd = toYmdString(dateInput);
  if (!ymd) return "";

  const [, month, day] = ymd.split("-");
  return `${month}/${day}`;
};

export const formatFullDate = (dateInput) => {
  const ymd = toYmdString(dateInput);
  if (!ymd) return "";

  const [year, month, day] = ymd.split("-");
  return `${month}/${day}/${year}`;
};

/* ============================
   Currency Formatting
============================ */

export const formatCash = (amount) => {
  if (typeof amount === "string") amount = parseFloat(amount);
  if (typeof amount !== "number" || isNaN(amount)) return "";

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  return `${Number(value).toFixed(2)}%`;
};
