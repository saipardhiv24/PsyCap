import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDateTime } from "../../utils/format.js";

/**
 * Custom SVG Candlestick Shape for Recharts
 */
function CandlestickShape(props) {
  const { x, y, width, height, payload } = props;
  if (!payload || payload.open == null || payload.close == null) {
    return null;
  }

  const { open, high, low, close } = payload;
  const isBullish = close >= open;

  const priceRange = high - low || 0.0001;
  const candleTopPrice = Math.max(open, close);
  const candleBottomPrice = Math.min(open, close);

  // y is pixel position of high, y + height is pixel position of low
  const yHigh = y;
  const yLow = y + height;

  const yOpen = yHigh + height * ((high - open) / priceRange);
  const yClose = yHigh + height * ((high - close) / priceRange);
  const yBodyTop = yHigh + height * ((high - candleTopPrice) / priceRange);
  const yBodyBottom = yHigh + height * ((high - candleBottomPrice) / priceRange);

  const bodyHeight = Math.max(yBodyBottom - yBodyTop, 2);
  const candleWidth = Math.max(Math.min(width - 2, 12), 2);
  const candleX = x + (width - candleWidth) / 2;
  const centerLineX = x + width / 2;

  const color = isBullish ? "#10b981" : "#ef4444";

  return (
    <g>
      {/* Wick line (high to low) */}
      <line
        x1={centerLineX}
        y1={yHigh}
        x2={centerLineX}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Candle body (open to close) */}
      <rect
        x={candleX}
        y={yBodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
        rx={1}
      />
    </g>
  );
}

/**
 * Theme-aware price chart supporting both Area & Candlestick (OHLC) views.
 */
export default function PriceChart({ data = [], positive = true, height = 320 }) {
  const [chartType, setChartType] = useState("area"); // 'area' | 'candlestick'

  const stroke = positive ? "rgb(var(--positive))" : "rgb(var(--negative))";
  const gradientId = positive ? "chartUp" : "chartDown";

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No price history data available
      </div>
    );
  }

  // Check if data has OHLC fields
  const hasOHLC = data.some(
    (item) =>
      item.open != null &&
      item.high != null &&
      item.low != null &&
      item.close != null,
  );

  // Prepare candle ranges for recharts y-domain calculation [low, high]
  const processedData = data.map((item) => ({
    ...item,
    value: item.value ?? item.close,
    candleRange:
      item.low != null && item.high != null ? [item.low, item.high] : [item.value, item.value],
  }));

  return (
    <div className="space-y-3">
      {/* Chart mode toolbar */}
      {hasOHLC && (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              chartType === "area"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Line / Area
          </button>
          <button
            type="button"
            onClick={() => setChartType("candlestick")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              chartType === "candlestick"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Candlestick (OHLC)
          </button>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {chartType === "candlestick" && hasOHLC ? (
          <ComposedChart
            data={processedData}
            margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
            />
            <Tooltip
              contentStyle={{
                background: "rgb(var(--elevated))",
                border: "1px solid rgb(var(--border))",
                borderRadius: 12,
                color: "rgb(var(--foreground))",
                fontSize: 12,
                boxShadow: "0 12px 32px -8px rgb(15 23 42 / 0.25)",
              }}
              labelStyle={{ color: "rgb(var(--muted-foreground))", marginBottom: 6 }}
              labelFormatter={(label, payload) => {
                const raw = payload?.[0]?.payload?.raw;
                return raw ? formatDateTime(raw) : label;
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                const isBull = p.close >= p.open;
                return (
                  <div className="rounded-xl border border-border bg-card p-3 shadow-card text-xs space-y-1.5 min-w-[170px]">
                    <div className="font-semibold text-muted-foreground border-b border-border pb-1">
                      {p.raw ? formatDateTime(p.raw) : label}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-medium tabular">
                      <span className="text-muted-foreground">Open:</span>
                      <span className="text-right text-foreground">{formatCurrency(p.open)}</span>
                      <span className="text-muted-foreground">High:</span>
                      <span className="text-right text-foreground">{formatCurrency(p.high)}</span>
                      <span className="text-muted-foreground">Low:</span>
                      <span className="text-right text-foreground">{formatCurrency(p.low)}</span>
                      <span className="text-muted-foreground">Close:</span>
                      <span
                        className={`text-right font-bold ${
                          isBull ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatCurrency(p.close)}
                      </span>
                      {p.volume != null && (
                        <>
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="text-right text-foreground">
                            {Number(p.volume).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="candleRange"
              shape={<CandlestickShape />}
              isAnimationActive={false}
            />
          </ComposedChart>
        ) : (
          <AreaChart
            data={processedData}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
            />
            <Tooltip
              contentStyle={{
                background: "rgb(var(--elevated))",
                border: "1px solid rgb(var(--border))",
                borderRadius: 12,
                color: "rgb(var(--foreground))",
                fontSize: 13,
                boxShadow: "0 12px 32px -8px rgb(15 23 42 / 0.25)",
              }}
              labelStyle={{ color: "rgb(var(--muted-foreground))", marginBottom: 4 }}
              labelFormatter={(label, payload) => {
                const raw = payload?.[0]?.payload?.raw;
                return raw ? formatDateTime(raw) : label;
              }}
              formatter={(val) => [formatCurrency(val), "Price"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
