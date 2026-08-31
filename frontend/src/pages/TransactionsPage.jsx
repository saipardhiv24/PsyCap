import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

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
    if (filter !== "ALL" && txn.transaction_type !== filter) {
      return false;
    }
    if (query && !txn.symbol.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Transactions</h1>
              <p className="mt-1 text-slate-400">
                View your buy and sell history in reverse chronological order.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("ALL")}
                className={`rounded-2xl px-4 py-3 text-sm ${filter === "ALL" ? "bg-slate-700 text-slate-100" : "bg-slate-950 text-slate-300"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("BUY")}
                className={`rounded-2xl px-4 py-3 text-sm ${filter === "BUY" ? "bg-slate-700 text-slate-100" : "bg-slate-950 text-slate-300"}`}
              >
                Buy
              </button>
              <button
                onClick={() => setFilter("SELL")}
                className={`rounded-2xl px-4 py-3 text-sm ${filter === "SELL" ? "bg-slate-700 text-slate-100" : "bg-slate-950 text-slate-300"}`}
              >
                Sell
              </button>
            </div>
          </div>
          <div className="mt-4 max-w-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by symbol"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3">Date</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center">
                    Loading transactions…
                  </td>
                </tr>
              ) : filteredTransactions.length ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-slate-800">
                    <td className="py-4 text-slate-300">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 font-semibold text-slate-100">
                      {txn.symbol}
                    </td>
                    <td
                      className={`py-4 font-semibold ${txn.transaction_type === "BUY" ? "text-emerald-300" : "text-rose-300"}`}
                    >
                      {txn.transaction_type}
                    </td>
                    <td className="py-4">{Number(txn.quantity).toFixed(2)}</td>
                    <td className="py-4">${Number(txn.price).toFixed(2)}</td>
                    <td className="py-4">
                      ${Number(txn.total_value).toFixed(2)}
                    </td>
                    <td
                      className={`py-4 ${Number(txn.realized_profit_loss) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      ${Number(txn.realized_profit_loss).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No matching transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
