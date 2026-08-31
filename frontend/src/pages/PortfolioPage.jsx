import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";
import { Card, Delta, EmptyState, Skeleton } from "../components/ui/primitives.jsx";
import { WalletIcon } from "../components/ui/icons.jsx";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

function StatTile({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={`mt-2 text-lg font-semibold tabular-nums ${
          accent === "up"
            ? "text-success"
            : accent === "down"
              ? "text-danger"
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
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Portfolio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your positions, portfolio value, and returns.
          </p>
        </div>

        {loading ? (
          <>
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </>
        ) : !portfolio ? (
          <Card>
            <EmptyState
              icon={<WalletIcon className="h-6 w-6" />}
              title="Couldn't load portfolio"
              description="Please refresh the page to try again."
            />
          </Card>
        ) : (
          <>
            <Card className="p-5 sm:p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Account value
                  </div>
                  <div className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                    {formatCurrency(portfolio.account_value)}
                  </div>
                </div>
                <Delta
                  value={portfolio.total_pl}
                  percent={portfolio.return_percent}
                  className="text-sm"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                  value={formatPercent(portfolio.return_percent)}
                  accent={portfolio.return_percent >= 0 ? "up" : "down"}
                />
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-foreground">
                  Holdings
                </h2>
              </div>

              {holdings.length === 0 ? (
                <EmptyState
                  icon={<WalletIcon className="h-6 w-6" />}
                  title="No holdings yet"
                  description="Buy your first stock to start building your portfolio."
                  action={
                    <Link
                      to="/stocks"
                      className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Explore markets
                    </Link>
                  }
                />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                          <th className="px-6 py-3">Symbol</th>
                          <th className="px-6 py-3 text-right">Shares</th>
                          <th className="px-6 py-3 text-right">Avg buy</th>
                          <th className="px-6 py-3 text-right">Current</th>
                          <th className="px-6 py-3 text-right">Value</th>
                          <th className="px-6 py-3 text-right">P/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding) => (
                          <tr
                            key={holding.symbol}
                            className="border-b border-border/60 transition last:border-0 hover:bg-muted/40"
                          >
                            <td className="px-6 py-4">
                              <Link
                                to={`/stocks/${holding.symbol}`}
                                className="block"
                              >
                                <div className="font-semibold text-foreground">
                                  {holding.symbol}
                                </div>
                                <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                                  {holding.company_name}
                                </div>
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-foreground">
                              {formatNumber(holding.quantity)}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-foreground">
                              {formatCurrency(holding.average_buy_price)}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-foreground">
                              {formatCurrency(holding.current_price)}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-foreground">
                              {formatCurrency(holding.current_value)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div
                                className={`font-semibold tabular-nums ${
                                  holding.unrealized_pl >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }`}
                              >
                                {formatCurrency(holding.unrealized_pl)}
                              </div>
                              <div
                                className={`text-xs tabular-nums ${
                                  holding.unrealized_pl_percent >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }`}
                              >
                                {formatPercent(holding.unrealized_pl_percent)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y divide-border md:hidden">
                    {holdings.map((holding) => (
                      <Link
                        key={holding.symbol}
                        to={`/stocks/${holding.symbol}`}
                        className="flex items-center justify-between gap-3 px-5 py-4 transition active:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground">
                            {holding.symbol}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {formatNumber(holding.quantity)} shares ·{" "}
                            {formatCurrency(holding.average_buy_price)} avg
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold tabular-nums text-foreground">
                            {formatCurrency(holding.current_value)}
                          </div>
                          <div
                            className={`text-xs tabular-nums ${
                              holding.unrealized_pl >= 0
                                ? "text-success"
                                : "text-danger"
                            }`}
                          >
                            {formatCurrency(holding.unrealized_pl)} (
                            {formatPercent(holding.unrealized_pl_percent)})
                          </div>
                        </div>
                      </Link>
                    ))}
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
