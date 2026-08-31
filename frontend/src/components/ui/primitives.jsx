import { Link } from "react-router-dom";
import { ArrowUpIcon, ArrowDownIcon } from "./icons.jsx";
import { formatPercent, formatSignedCurrency, isPositive } from "../../utils/format.js";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ Card */

export function Card({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag
      className={cx(
        "rounded-2xl border border-border bg-card shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- Button */

const buttonVariants = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-105 shadow-card disabled:opacity-50",
  secondary:
    "bg-muted text-foreground hover:bg-border disabled:opacity-50",
  outline:
    "border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50",
  positive:
    "bg-positive text-white hover:brightness-105 disabled:opacity-50",
  negative:
    "bg-negative text-white hover:brightness-105 disabled:opacity-50",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  as,
  ...props
}) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );

  if (as === "link") {
    const { to, ...rest } = props;
    return (
      <Link to={to} className={classes} {...rest} />
    );
  }
  return <button className={classes} {...props} />;
}

/* ----------------------------------------------------------------- Badge */

export function Badge({ tone = "neutral", className = "", children }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    positive: "bg-positive-muted text-positive",
    negative: "bg-negative-muted text-negative",
    primary: "bg-primary-muted text-primary",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- DeltaPill */
/* Shows a signed change with a directional arrow, colored by sign. */

export function DeltaPill({ value, percent, size = "md", className = "" }) {
  const positive = isPositive(percent ?? value);
  const Icon = positive ? ArrowUpIcon : ArrowDownIcon;
  const sizes = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-lg font-semibold tabular",
        positive ? "bg-positive-muted text-positive" : "bg-negative-muted text-negative",
        sizes[size],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {percent !== undefined && percent !== null
        ? formatPercent(Math.abs(Number(percent)))
        : formatSignedCurrency(value)}
    </span>
  );
}

/* --------------------------------------------------------------- Skeleton */

export function Skeleton({ className = "" }) {
  return <div className={cx("skeleton rounded-lg", className)} />;
}

/* ------------------------------------------------------------- EmptyState */

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* --------------------------------------------------------------- Spinner */

export function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg
      className={cx("animate-spin text-current", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ Logo */

export function Logo({ withText = true, className = "" }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M4 16l4-5 3.5 3L20 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="6" r="2" fill="currentColor" />
        </svg>
      </span>
      {withText ? (
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          Psy<span className="text-primary">Cap</span>
        </span>
      ) : null}
    </span>
  );
}

/* --------------------------------------------------------------- Avatar */

export function Avatar({ name = "", className = "" }) {
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full bg-primary-muted text-sm font-bold text-primary",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
