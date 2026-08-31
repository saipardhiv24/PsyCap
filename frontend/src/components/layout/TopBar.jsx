import { Logo, Avatar } from "../ui/primitives.jsx";
import ThemeToggle from "../ui/ThemeToggle.jsx";
import { getMarketStatus } from "../../utils/format.js";

export default function TopBar({ title, subtitle, displayName }) {
  const market = getMarketStatus();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile logo (sidebar is hidden on small screens) */}
        <div className="lg:hidden">
          <Logo withText={false} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:flex"
          title={market.label}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              market.isOpen ? "bg-positive" : "bg-muted-foreground"
            } ${market.isOpen ? "animate-pulse" : ""}`}
          />
          <span className="text-xs font-semibold text-muted-foreground">
            {market.label}
          </span>
        </div>

        <ThemeToggle />

        <Avatar name={displayName || "PsyCap"} className="h-10 w-10" />
      </div>
    </header>
  );
}
