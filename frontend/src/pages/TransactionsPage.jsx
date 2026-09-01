import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";
import {
  Card,
  Badge,
  Skeleton,
  EmptyState,
  cx,
} from "../components/ui/primitives.jsx";
import {
  TransactionsIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "../components/ui/icons.jsx";
import { formatCurrency, formatNumber, formatDate } from "../utils/format.js";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await api.get("/transactions");
        setTransactions(response.data.data.transactions);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    if (filter !== "ALL" && String(txn.transaction_type).toUpperCase() !== filter) {
      return false;
    }
    if (query && !txn.symbol.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <PageLayout
      title="Transactions"
      subtitle="View your buy and sell trade history"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Controls card */}
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted p-1">
              {["ALL", "BUY", "SELL"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(type)}
                  className={cx(
                    "rounded-lg px-4 py-1.5 text-xs font-bold transition",
                    filter === type
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {type === "ALL" ? "All trades" : type}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative flex-1 max-w-xs">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by symbol"
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Card>

        {/* Transactions list card */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Trade log
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredTransactions.length ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Symbol</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5 text-right">Shares</th>
                      <th className="px-6 py-3.5 text-right">Execution Price</th>
                      <th className="px-6 py-3.5 text-right">Total Amount</th>
                      <th className="px-6 py-3.5 text-right">Realized P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransactions.map((txn) => {
                      const isBuy = String(txn.transaction_type).toUpperCase() === "BUY";
                      const pnl = Number(txn.realized_profit_loss || 0);
                      const pnlPos = pnl >= 0;

                      return (
                        <tr
                          key={txn.id}
                          className="transition hover:bg-muted/40"
                        >
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                            {formatDate(txn.created_at)}
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">
                            {txn.symbol}
                          </td>
                          <td className="px-6 py-4">
                            <Badge tone={isBuy ? "positive" : "negative"}>
                              {isBuy ? (
                                <ArrowDownIcon className="h-3 w-3" />
                              ) : (
                                <ArrowUpIcon className="h-3 w-3" />
                              )}
                              {txn.transaction_type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold tabular text-foreground">
                            {formatNumber(txn.quantity)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold tabular text-foreground">
                            {formatCurrency(txn.price)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold tabular text-foreground">
                            {formatCurrency(txn.total_value)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isBuy && pnl !== 0 ? (
                              <span
                                className={cx(
                                  "font-bold tabular",
                                  pnlPos ? "text-positive" : "text-negative",
                                )}
                              >
                                {formatCurrency(pnl)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-border md:hidden">
                {filteredTransactions.map((txn) => {
                  const isBuy = String(txn.transaction_type).toUpperCase() === "BUY";
                  const pnl = Number(txn.realized_profit_loss || 0);
                  const pnlPos = pnl >= 0;

                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cx(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            isBuy
                              ? "bg-positive-muted text-positive"
                              : "bg-negative-muted text-negative",
                          )}
                        >
                          {isBuy ? (
                            <ArrowDownIcon className="h-4 w-4" />
                          ) : (
                            <ArrowUpIcon className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              {txn.symbol}
                            </span>
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              {txn.transaction_type}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(txn.quantity)} shares · {formatDate(txn.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold tabular text-foreground">
                          {formatCurrency(txn.total_value)}
                        </div>
                        {!isBuy && pnl !== 0 ? (
                          <div
                            className={cx(
                              "text-xs font-semibold tabular",
                              pnlPos ? "text-positive" : "text-negative",
                            )}
                          >
                            P/L: {formatCurrency(pnl)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={TransactionsIcon}
                title="No matching transactions"
                description={
                  query || filter !== "ALL"
                    ? "Try adjusting your search query or filter settings."
                    : "Execute a trade on any stock to see your history here."
                }
              />
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
