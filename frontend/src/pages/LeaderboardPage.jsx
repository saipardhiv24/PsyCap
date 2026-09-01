import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";
import {
  Card,
  Badge,
  Skeleton,
  EmptyState,
  Avatar,
  cx,
} from "../components/ui/primitives.jsx";
import { LeaderboardIcon, ArrowUpIcon, ArrowDownIcon } from "../components/ui/icons.jsx";
import { formatCurrency, formatPercent } from "../utils/format.js";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const response = await api.get("/leaderboard");
        setLeaderboard(response.data.data.leaderboard);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const top3 = leaderboard.slice(0, 3);

  return (
    <PageLayout
      title="Leaderboard"
      subtitle="Rankings based on overall return percentage"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Top 3 Podium Highlights */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : top3.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {top3.map((entry) => {
              const isGold = entry.rank === 1;
              const isSilver = entry.rank === 2;
              const isBronze = entry.rank === 3;
              const isPos = entry.return_percent >= 0;

              return (
                <Card
                  key={entry.rank}
                  className={cx(
                    "relative overflow-hidden p-5 flex flex-col justify-between border",
                    isGold
                      ? "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-card"
                      : isSilver
                        ? "border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-card"
                        : "border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-card",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={entry.username} className="h-10 w-10 text-sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate max-w-[120px]">
                          {entry.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(entry.account_value)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={cx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-card",
                        isGold
                          ? "bg-amber-500 text-slate-950"
                          : isSilver
                            ? "bg-slate-300 text-slate-950"
                            : "bg-amber-700 text-white",
                      )}
                    >
                      #{entry.rank}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-border/50 pt-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Return
                    </span>
                    <div className="text-right">
                      <span
                        className={cx(
                          "text-lg font-extrabold tabular",
                          isPos ? "text-positive" : "text-negative",
                        )}
                      >
                        {formatPercent(entry.return_percent, { withSign: true })}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}

        {/* Full Leaderboard Table Card */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Trader rankings
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {leaderboard.length} trader{leaderboard.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : leaderboard.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3.5 w-16">Rank</th>
                    <th className="px-6 py-3.5">Trader</th>
                    <th className="px-6 py-3.5 text-right">Account Value</th>
                    <th className="px-6 py-3.5 text-right">Total P/L</th>
                    <th className="px-6 py-3.5 text-right">Return %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaderboard.map((entry) => {
                    const plPos = entry.total_pl >= 0;
                    const retPos = entry.return_percent >= 0;

                    return (
                      <tr
                        key={entry.rank}
                        className="transition hover:bg-muted/40"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={cx(
                              "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                              entry.rank === 1
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold"
                                : entry.rank === 2
                                  ? "bg-slate-400/20 text-slate-700 dark:text-slate-300 font-bold"
                                  : entry.rank === 3
                                    ? "bg-amber-700/20 text-amber-800 dark:text-amber-500 font-bold"
                                    : "text-muted-foreground",
                            )}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={entry.username} className="h-8 w-8 text-xs" />
                            <span className="font-bold text-foreground">
                              {entry.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold tabular text-foreground">
                          {formatCurrency(entry.account_value)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={cx(
                              "font-semibold tabular",
                              plPos ? "text-positive" : "text-negative",
                            )}
                          >
                            {formatCurrency(entry.total_pl)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge tone={retPos ? "positive" : "negative"}>
                            {retPos ? (
                              <ArrowUpIcon className="h-3 w-3" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3" />
                            )}
                            {formatPercent(entry.return_percent, { withSign: true })}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={LeaderboardIcon}
                title="No leaderboard entries yet"
                description="Trade history will generate rankings as users place trades."
              />
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
