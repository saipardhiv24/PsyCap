import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";
import { Card, DeltaPill, EmptyState, Skeleton } from "../components/ui/primitives.jsx";
import { WalletIcon, ArrowUpIcon, ArrowDownIcon } from "../components/ui/icons.jsx";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

function StatTile({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={`mt-2 text-lg font-bold tabular ${
          accent === "up"
            ? "text-positive"
            : accent === "down"
              ? "text-negative"
              : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const response = await api.get("/portfolio");
        setPortfolio(response.data.data.portfolio);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const holdings = portfolio?.holdings ?? [];

  return (
    <PageLayout
      title="Portfolio"
      subtitle="Track your positions, portfolio value, and returns"
    >
      <div className="space-y-6 animate-fade-in">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        ) : !portfolio ? (
          <Card className="p-8">
            <EmptyState
              icon={WalletIcon}
              title="Couldn't load portfolio"
              description="Please refresh the page to try again."
            />
          </Card>
        ) : (
          <>
            {/* Account overview card */}
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Account Value
                  </div>
                  <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular sm:text-4xl">
                    {formatCurrency(portfolio.account_value)}
                  </div>
                </div>
                <DeltaPill
                  value={portfolio.total_pl}
                  percent={portfolio.return_percent}
                  size="md"
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                  label="Cash balance"
                  value={formatCurrency(portfolio.cash_balance)}
                />
                <StatTile
                  label="Portfolio value"
                  value={formatCurrency(portfolio.portfolio_value)}
                />
                <StatTile
                  label="Total P/L"
                  value={formatCurrency(portfolio.total_pl)}
                  accent={portfolio.total_pl >= 0 ? "up" : "down"}
                />
                <StatTile
                  label="Return"
                  value={formatPercent(portfolio.return_percent, { withSign: true })}
                  accent={portfolio.return_percent >= 0 ? "up" : "down"}
                />
              </div>
            </Card>

            {/* Holdings section */}
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Holdings
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {holdings.length} position{holdings.length === 1 ? "" : "s"} open
                  </p>
                </div>
                {holdings.length > 0 && (
                  <Link
                    to="/stocks"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    + Trade more stocks
                  </Link>
                )}
              </div>

              {holdings.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={WalletIcon}
                    title="No holdings yet"
                    description="Buy your first stock to start building your portfolio."
                    action={
                      <Link
                        to="/stocks"
                        className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:brightness-105"
                      >
                        Explore markets
                      </Link>
                    }
                  />
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <th className="px-6 py-3.5">Symbol</th>
                          <th className="px-6 py-3.5 text-right">Shares</th>
                          <th className="px-6 py-3.5 text-right">Avg buy</th>
                          <th className="px-6 py-3.5 text-right">Current price</th>
                          <th className="px-6 py-3.5 text-right">Market value</th>
                          <th className="px-6 py-3.5 text-right">Unrealized P/L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {holdings.map((holding) => {
                          const plPos = holding.unrealized_pl >= 0;
                          return (
                            <tr
                              key={holding.symbol}
                              className="transition hover:bg-muted/40"
                            >
                              <td className="px-6 py-4">
                                <Link
                                  to={`/stocks/${holding.symbol}`}
                                  className="group flex items-center gap-3"
                                >
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-xs font-bold text-foreground group-hover:bg-primary-muted group-hover:text-primary transition">
                                    {holding.symbol.slice(0, 4)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-foreground group-hover:text-primary transition">
                                      {holding.symbol}
                                    </div>
                                    <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                                      {holding.company_name}
                                    </div>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-right font-semibold tabular text-foreground">
                                {formatNumber(holding.quantity)}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold tabular text-foreground">
                                {formatCurrency(holding.average_buy_price)}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold tabular text-foreground">
                                {formatCurrency(holding.current_price)}
                              </td>
                              <td className="px-6 py-4 text-right font-bold tabular text-foreground">
                                {formatCurrency(holding.current_value)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div
                                  className={`font-bold tabular ${
                                    plPos ? "text-positive" : "text-negative"
                                  }`}
                                >
                                  {formatCurrency(holding.unrealized_pl)}
                                </div>
                                <div
                                  className={`text-xs font-semibold tabular ${
                                    plPos ? "text-positive" : "text-negative"
                                  }`}
                                >
                                  {formatPercent(holding.unrealized_pl_percent, {
                                    withSign: true,
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y divide-border md:hidden">
                    {holdings.map((holding) => {
                      const plPos = holding.unrealized_pl >= 0;
                      return (
                        <Link
                          key={holding.symbol}
                          to={`/stocks/${holding.symbol}`}
                          className="flex items-center justify-between gap-3 px-5 py-4 transition active:bg-muted/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-foreground">
                              {holding.symbol.slice(0, 4)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground">
                                {holding.symbol}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {formatNumber(holding.quantity)} shares ·{" "}
                                {formatCurrency(holding.average_buy_price)} avg
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold tabular text-foreground">
                              {formatCurrency(holding.current_value)}
                            </div>
                            <div
                              className={`text-xs font-semibold tabular ${
                                plPos ? "text-positive" : "text-negative"
                              }`}
                            >
                              {formatCurrency(holding.unrealized_pl)} (
                              {formatPercent(holding.unrealized_pl_percent, { withSign: true })})
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
