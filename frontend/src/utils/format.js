// Formatting helpers used across the redesigned UI. These are display-only and
// never fabricate values — they simply format whatever the API returns.

export function formatCurrency(value, { compact = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatPercent(value, { withSign = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--%";
  const sign = withSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatSignedCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$--";
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${formatCurrency(Math.abs(n))}`;
}

export function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isPositive(value) {
  return Number(value) >= 0;
}

// Compute US equity market status (Eastern Time, Mon–Fri 9:30–16:00).
// Purely derived from the current clock — not fabricated market data.
export function getMarketStatus(now = new Date()) {
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const day = et.getDay();
  const minutes = et.getHours() * 60 + et.getMinutes();
  const isWeekday = day >= 1 && day <= 5;
  const open = 9 * 60 + 30;
  const close = 16 * 60;
  const isOpen = isWeekday && minutes >= open && minutes < close;
  return {
    isOpen,
    label: isOpen ? "Market open" : "Market closed",
  };
}
