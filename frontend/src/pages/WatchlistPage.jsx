import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";
import { useToast } from "../context/ToastContext.jsx";
import {
  Card,
  Button,
  Skeleton,
  EmptyState,
  cx,
} from "../components/ui/primitives.jsx";
import { WatchlistIcon, TrashIcon, ChevronRightIcon, PlusIcon } from "../components/ui/icons.jsx";

export default function WatchlistPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadWatchlist() {
      try {
        const response = await api.get("/watchlist");
        setItems(response.data.data.watchlist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadWatchlist();
  }, []);

  async function addItem(event) {
    event.preventDefault();
    if (!symbol.trim()) return;
    setAdding(true);
    try {
      const sym = symbol.toUpperCase().trim();
      const comp = companyName.trim() || sym;
      await api.post("/watchlist", {
        symbol: sym,
        company_name: comp,
      });
      const response = await api.get("/watchlist");
      setItems(response.data.data.watchlist);
      setSymbol("");
      setCompanyName("");
      toast.success("Added to Watchlist", `${sym} has been added.`);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error?.message || err.message || "Could not add stock";
      toast.error("Failed to add", msg);
    } finally {
      setAdding(false);
    }
  }

  async function removeItem(symbolToRemove) {
    try {
      await api.delete(`/watchlist/${symbolToRemove}`);
      setItems((prev) => prev.filter((item) => item.symbol !== symbolToRemove));
      toast.success("Removed", `${symbolToRemove} was removed from your watchlist.`);
    } catch (err) {
      console.error(err);
      toast.error("Error", "Could not remove item from watchlist.");
    }
  }

  return (
    <PageLayout
      title="Watchlist"
      subtitle="Monitor stocks you want to track and quickly open details"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Add stock card */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-foreground">
            Track a new stock
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add any stock ticker symbol to follow its movements.
          </p>

          <form
            onSubmit={addItem}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Symbol (e.g. AAPL)"
              required
              className="h-11 flex-1 max-w-xs rounded-xl border border-border bg-background px-4 text-sm font-semibold uppercase text-foreground outline-none transition placeholder:normal-case placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name (optional)"
              className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" size="md" disabled={adding || !symbol.trim()}>
              <PlusIcon className="h-4 w-4" />
              {adding ? "Adding…" : "Add Stock"}
            </Button>
          </form>
        </Card>

        {/* Watchlist table card */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Saved stocks
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : items.length ? (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div
                  key={item.id || item.symbol}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-foreground">
                      {item.symbol.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/stocks/${item.symbol}`}
                        className="font-bold text-foreground hover:text-primary transition truncate block"
                      >
                        {item.symbol}
                      </Link>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.company_name || item.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/stocks/${item.symbol}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                    >
                      View
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.symbol)}
                      title="Remove from watchlist"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-negative-muted hover:text-negative transition"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={WatchlistIcon}
                title="Your watchlist is empty"
                description="Use the form above to add stocks you want to follow closely."
              />
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
