import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [portfolioRes, stocksRes, watchlistRes, transactionsRes] =
          await Promise.all([
            api.get("/portfolio"),
            api.get("/stocks"),
            api.get("/watchlist"),
            api.get("/transactions"),
          ]);
        setPortfolio(portfolioRes.data.data.portfolio);
        setStocks(stocksRes.data.data.stocks.slice(0, 6));
        setWatchlist(watchlistRes.data.data.watchlist);
        setTransactions(transactionsRes.data.data.transactions.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-100">
        Loading dashboard…
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-sm uppercase text-slate-500">
              Available Cash
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-100">
              ${portfolio?.cash_balance.toFixed(2)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-sm uppercase text-slate-500">
              Portfolio Value
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-100">
              ${portfolio?.portfolio_value.toFixed(2)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-sm uppercase text-slate-500">
              Total Account Value
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-100">
              ${portfolio?.account_value.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-sm uppercase text-slate-500">Total P/L</div>
            <div className="mt-3 text-3xl font-semibold text-emerald-400">
              ${portfolio?.total_pl.toFixed(2)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-sm uppercase text-slate-500">Return %</div>
            <div className="mt-3 text-3xl font-semibold text-emerald-400">
              {portfolio?.return_percent.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Market overview</h2>
              <span className="text-sm text-slate-400">
                Live prices via Twelve Data
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div>
                    <div className="text-sm text-slate-400">{stock.symbol}</div>
                    <div className="font-semibold text-slate-100">
                      {stock.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-100">
                      ${stock.quote?.price?.toFixed(2) ?? "--"}
                    </div>
                    <div
                      className={`text-sm ${stock.quote?.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {stock.quote?.percent_change?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent transactions</h2>
            </div>
            <div className="mt-6 space-y-3">
              {transactions.length ? (
                transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-slate-400">
                          {txn.symbol}
                        </div>
                        <div className="font-semibold text-slate-100">
                          {txn.transaction_type}
                        </div>
                      </div>
                      <div className="text-right text-slate-300">
                        ${Number(txn.total_value).toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                      <span>
                        {new Date(txn.created_at).toLocaleDateString()}
                      </span>
                      <span>{txn.quantity} shares</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-6 text-slate-400">
                  No transactions yet. Buy a stock to start trading.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
