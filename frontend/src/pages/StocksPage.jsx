import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

export default function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStocks() {
      try {
        const response = await api.get("/stocks");
        setStocks(response.data.data.stocks);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadStocks();
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.get("/stocks/search", {
        params: { q: query },
      });
      setStocks(response.data.data.stocks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Stocks</h1>
              <p className="mt-1 text-slate-400">
                Browse US stocks and open a detail page to buy or sell.
              </p>
            </div>
            <form
              onSubmit={handleSearch}
              className="flex w-full gap-2 md:w-auto"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol or name"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
              Loading stocks…
            </div>
          ) : stocks.length ? (
            stocks.map((stock) => (
              <Link
                key={stock.symbol}
                to={`/stocks/${stock.symbol}`}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-slate-400 text-sm">{stock.name}</div>
                    <div className="text-lg font-semibold text-slate-100">
                      {stock.symbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-100">
                      ${stock.quote?.price?.toFixed(2) ?? "--"}
                    </div>
                    <div
                      className={`text-sm ${stock.quote?.percent_change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {stock.quote?.percent_change?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              No stocks found. Try a different symbol or company name.
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
