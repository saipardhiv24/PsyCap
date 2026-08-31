import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDateTime } from "../../utils/format.js";

/**
 * Theme-aware area chart for a price/value series.
 * Expects `data` as an array of { label, value } points already derived from
 * the API response — this component never generates data itself.
 */
export default function PriceChart({ data = [], positive = true, height = 280 }) {
  const stroke = positive ? "rgb(var(--positive))" : "rgb(var(--negative))";
  const gradientId = positive ? "chartUp" : "chartDown";

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
          formatter={(value) => [formatCurrency(value), "Value"]}
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
    </ResponsiveContainer>
  );
}
