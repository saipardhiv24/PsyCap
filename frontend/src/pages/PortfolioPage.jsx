import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-100">
        Loading portfolio…
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-semibold">Portfolio</h1>
          <p className="mt-1 text-slate-400">
            Track your positions, portfolio value, and returns.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-100">
              <div className="text-sm text-slate-400">Cash balance</div>
              <div className="mt-3 text-2xl font-semibold">
                ${portfolio.cash_balance.toFixed(2)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-100">
              <div className="text-sm text-slate-400">Portfolio value</div>
              <div className="mt-3 text-2xl font-semibold">
                ${portfolio.portfolio_value.toFixed(2)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-100">
              <div className="text-sm text-slate-400">Account value</div>
              <div className="mt-3 text-2xl font-semibold">
                ${portfolio.account_value.toFixed(2)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-100">
              <div className="text-sm text-slate-400">Total P/L</div>
              <div className="mt-3 text-2xl font-semibold">
                ${portfolio.total_pl.toFixed(2)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-100">
              <div className="text-sm text-slate-400">Return %</div>
              <div className="mt-3 text-2xl font-semibold">
                {portfolio.return_percent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 overflow-x-auto">
          <h2 className="text-xl font-semibold">Holdings</h2>
          <div className="mt-4 min-w-[900px]">
            <table className="w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Shares</th>
                  <th className="pb-3">Avg Buy</th>
                  <th className="pb-3">Current</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Unrealized P/L</th>
                  <th className="pb-3">P/L %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.length ? (
                  portfolio.holdings.map((holding) => (
                    <tr
                      key={holding.symbol}
                      className="bg-slate-950 rounded-3xl"
                    >
                      <td className="py-4 pr-6 font-semibold text-slate-100">
                        {holding.symbol}
                      </td>
                      <td className="py-4 pr-6 text-slate-400">
                        {holding.company_name}
                      </td>
                      <td className="py-4 pr-6 text-slate-100">
                        {Number(holding.quantity).toFixed(2)}
                      </td>
                      <td className="py-4 pr-6 text-slate-100">
                        ${Number(holding.average_buy_price).toFixed(2)}
                      </td>
                      <td className="py-4 pr-6 text-slate-100">
                        ${Number(holding.current_price).toFixed(2)}
                      </td>
                      <td className="py-4 pr-6 text-slate-100">
                        ${Number(holding.current_value).toFixed(2)}
                      </td>
                      <td
                        className={`py-4 pr-6 font-semibold ${holding.unrealized_pl >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        ${Number(holding.unrealized_pl).toFixed(2)}
                      </td>
                      <td
                        className={`py-4 pr-6 font-semibold ${holding.unrealized_pl_percent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {Number(holding.unrealized_pl_percent).toFixed(2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No holdings yet. Buy your first stock to build a
                      portfolio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
