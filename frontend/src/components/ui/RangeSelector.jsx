import { cx } from "./primitives.jsx";

export default function RangeSelector({ options, value, onChange, className = "" }) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-muted p-1",
        className,
      )}
      role="tablist"
      aria-label="Time range"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
