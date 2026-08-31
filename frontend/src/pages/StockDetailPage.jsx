import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout.jsx";
import PriceChart from "../components/ui/PriceChart.jsx";
import RangeSelector from "../components/ui/RangeSelector.jsx";
import api from "../utils/api.js";
import { useToast } from "../context/ToastContext.jsx";
import {
  Card,
  Button,
  DeltaPill,
  Skeleton,
  cx,
} from "../components/ui/primitives.jsx";
import { ChevronRightIcon } from "../components/ui/icons.jsx";
import { formatCurrency, isPositive } from "../utils/format.js";

const ranges = [
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "1Y", label: "1Y" },
];

export default function StockDetailPage() {
  const { symbol } = useParams();
  const toast = useToast();
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [tradeType, setTradeType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [processingTrade, setProcessingTrade] = useState(false);

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
    if (!isValidQuantity(quantity)) {
      toast.error(
        "Invalid quantity",
        "Enter a whole number of 1 or more.",
      );
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
      toast.success(
        `${tradeType === "buy" ? "Bought" : "Sold"} ${quantity} ${symbol}`,
        `Order filled at ${formatCurrency(quote?.price)} per share.`,
      );
      // refresh quote and history
      await loadData();
    } catch (err) {
      console.error(err);
      const text =
        err?.response?.data?.error || err?.message || "Trade failed.";
      toast.error("Trade failed", text);
    } finally {
      setProcessingTrade(false);
    }
  }

  const chartData = useMemo(
    () =>
      history.map((item) => ({
        label: item.datetime,
        raw: item.datetime,
        value: item.close,
      })),
    [history],
  );

  const positive = isPositive(quote?.percent_change);

  return (
    <PageLayout title={symbol} subtitle="Live quote and price history">
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/stocks" className="font-medium hover:text-foreground">
            Markets
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="font-semibold text-foreground">{symbol}</span>
        </nav>

        {/* Quote header */}
        <Card className="p-6 sm:p-8">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-12 w-40" />
            </div>
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-sm font-bold text-foreground">
                  {symbol.slice(0, 4)}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
                  {symbol}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground">
                  Current price
                </div>
                <div className="text-4xl font-extrabold tracking-tight text-foreground tabular">
                  {quote?.price != null ? formatCurrency(quote.price) : "$--"}
                </div>
                {quote?.percent_change != null ? (
                  <DeltaPill
                    percent={quote.percent_change}
                    className="mt-2"
                  />
                ) : null}
              </div>
            </div>
          )}
        </Card>

        {/* Chart */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-foreground">
              Price history
            </h3>
            <RangeSelector
              options={ranges}
              value={range}
              onChange={setRange}
            />
          </div>
          <div className="mt-6">
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : (
              <PriceChart data={chartData} positive={positive} />
            )}
          </div>
        </Card>

        {/* Trade panel */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-foreground">Trade</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy or sell shares of {symbol} with virtual cash.
          </p>

          {/* Buy / Sell toggle */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setTradeType("buy")}
              className={cx(
                "h-10 rounded-lg text-sm font-bold transition",
                tradeType === "buy"
                  ? "bg-positive text-white shadow-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setTradeType("sell")}
              className={cx(
                "h-10 rounded-lg text-sm font-bold transition",
                tradeType === "sell"
                  ? "bg-negative text-white shadow-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sell
            </button>
          </div>

          <form
            onSubmit={handleTrade}
            className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="flex-1">
              <label
                htmlFor="quantity"
                className="text-sm font-medium text-muted-foreground"
              >
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="mt-2 h-12 w-full max-w-[200px] rounded-xl border border-border bg-background px-4 text-base font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 tabular"
              />

              <dl className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <dt className="text-muted-foreground">Current price</dt>
                  <dd className="font-semibold text-foreground tabular">
                    {quote?.price != null ? formatCurrency(quote.price) : "$--"}
                  </dd>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <dt className="text-muted-foreground">Estimated total</dt>
                  <dd className="font-bold text-foreground tabular">
                    {formatCurrency(estimatedValue)}
                  </dd>
                </div>
              </dl>
            </div>

            <Button
              type="submit"
              size="lg"
              variant={tradeType === "buy" ? "positive" : "negative"}
              disabled={processingTrade || !isValidQuantity(quantity)}
              className="w-full lg:w-auto"
            >
              {processingTrade
                ? "Processing…"
                : tradeType === "buy"
                  ? `Buy ${symbol}`
                  : `Sell ${symbol}`}
            </Button>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
}
