import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

export default function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    setError("");
    try {
      await api.post("/watchlist", {
        symbol: symbol.toUpperCase(),
        company_name: companyName,
      });
      const response = await api.get("/watchlist");
      setItems(response.data.data.watchlist);
      setSymbol("");
      setCompanyName("");
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Could not add watchlist item",
      );
    }
  }

  async function removeItem(symbolToRemove) {
    try {
      await api.delete(`/watchlist/${symbolToRemove}`);
      setItems(items.filter((item) => item.symbol !== symbolToRemove));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Watchlist</h1>
              <p className="mt-1 text-slate-400">
                Monitor stocks you want to track and quickly open details.
              </p>
            </div>
            <form onSubmit={addItem} className="flex w-full gap-2 md:w-auto">
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Symbol"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              />
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Add
              </button>
            </form>
          </div>
          {error && (
            <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-100">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3">Symbol</th>
                  <th>Company</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center">
                      Loading watchlist…
                    </td>
                  </tr>
                ) : items.length ? (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800">
                      <td className="py-4 font-semibold text-slate-100">
                        {item.symbol}
                      </td>
                      <td className="py-4">{item.company_name}</td>
                      <td className="py-4 text-right">
                        <div className="inline-flex gap-2">
                          <Link
                            to={`/stocks/${item.symbol}`}
                            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-sky-300"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.symbol)}
                            className="rounded-2xl bg-rose-500 px-4 py-2 text-sm text-slate-950"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-400">
                      No watchlist items yet. Add a stock to follow it.
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
