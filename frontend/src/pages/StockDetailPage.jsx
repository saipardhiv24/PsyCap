import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

const ranges = ["1D", "1W", "1M", "3M", "1Y"];

export default function StockDetailPage() {
  const { symbol } = useParams();
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [tradeType, setTradeType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [processingTrade, setProcessingTrade] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quoteRes, historyRes] = await Promise.all([
        api.get(`/stocks/${symbol}`),
        api.get(`/stocks/${symbol}/history`, { params: { range } }),
      ]);
      setQuote(quoteRes.data.data.quote);
      setHistory(historyRes.data.data.history);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isValidQuantity = (q) => {
    const n = Number(q);
    return Number.isFinite(n) && n >= 1 && Math.floor(n) === n;
  };

  const estimatedValue =
    quote?.price && isValidQuantity(quantity)
      ? quote.price * Number(quantity)
      : 0;

  async function handleTrade(e) {
    e?.preventDefault();
    setMessage(null);
    if (!isValidQuantity(quantity)) {
      setMessage({
        type: "error",
        text: "Enter a valid quantity (whole number >= 1).",
      });
      return;
    }
    setProcessingTrade(true);
    try {
      if (tradeType === "buy") {
        await api.post("/trades/buy", {
          symbol,
          quantity: Number(quantity),
          company_name: symbol,
        });
      } else {
        await api.post("/trades/sell", {
          symbol,
          quantity: Number(quantity),
        });
      }
      setMessage({
        type: "success",
        text: `Successfully ${tradeType === "buy" ? "bought" : "sold"} ${quantity} ${symbol}.`,
      });
      // refresh quote and history
      await loadData();
    } catch (err) {
      console.error(err);
      const text =
        err?.response?.data?.error || err?.message || "Trade failed.";
      setMessage({ type: "error", text });
    } finally {
      setProcessingTrade(false);
    }
  }

  const chartData = useMemo(
    () =>
      history.map((item) => ({
        time: item.datetime,
        price: item.close,
      })),
    [history],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-100">
        Loading stock details…
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{symbol}</h1>
              <p className="mt-1 text-slate-400">
                Live quote and historical price action
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 px-5 py-4 text-right">
              <div className="text-sm text-slate-400">Current Price</div>
              <div className="text-3xl font-semibold text-slate-100">
                ${quote?.price?.toFixed(2) ?? "--"}
              </div>
              <div
                className={`mt-1 text-sm ${quote?.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {quote?.percent_change?.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3 text-slate-400">
            {ranges.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-2xl px-4 py-2 text-sm transition ${range === option ? "bg-slate-800 text-slate-100" : "bg-slate-950 text-slate-400 hover:bg-slate-900"}`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Trade</h2>
          <p className="mt-1 text-sm text-slate-400">
            Buy or sell shares of {symbol}
          </p>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTradeType("buy")}
                className={`rounded-full px-4 py-2 text-sm ${tradeType === "buy" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:bg-slate-900"}`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setTradeType("sell")}
                className={`rounded-full px-4 py-2 text-sm ${tradeType === "sell" ? "bg-rose-600 text-white" : "bg-slate-950 text-slate-400 hover:bg-slate-900"}`}
              >
                SELL
              </button>
            </div>

            <form
              onSubmit={handleTrade}
              className="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-sm text-slate-400">Quantity</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-40 rounded-xl bg-slate-950 px-3 py-2 text-slate-100 shadow-sm"
                />
                <div className="mt-1 text-sm text-slate-400">
                  Current Price:{" "}
                  <span className="text-slate-100">
                    ${quote?.price?.toFixed(2) ?? "--"}
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  Estimated Value:{" "}
                  <span className="text-slate-100">
                    ${estimatedValue ? estimatedValue.toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 lg:items-end">
                {message && (
                  <div
                    className={`rounded-md px-3 py-2 text-sm ${message.type === "success" ? "bg-emerald-900 text-emerald-200" : "bg-rose-900 text-rose-200"}`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processingTrade || !isValidQuantity(quantity)}
                  className={`mt-2 rounded-2xl px-6 py-2 text-sm font-semibold ${processingTrade || !isValidQuantity(quantity) ? "bg-slate-700 text-slate-400" : tradeType === "buy" ? "bg-emerald-500 text-slate-900" : "bg-rose-500 text-slate-900"}`}
                >
                  {processingTrade
                    ? "Processing…"
                    : tradeType === "buy"
                      ? "Buy"
                      : "Sell"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
