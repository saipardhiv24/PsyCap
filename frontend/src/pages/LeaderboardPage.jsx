import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

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

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <p className="mt-1 text-slate-400">
            Rankings are based on return percentage, with account value shown
            for context.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3">Rank</th>
                <th>Username</th>
                <th>Account Value</th>
                <th>P/L</th>
                <th>Return</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center">
                    Loading leaderboard…
                  </td>
                </tr>
              ) : leaderboard.length ? (
                leaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-b border-slate-800">
                    <td className="py-4 font-semibold text-slate-100">
                      {entry.rank}
                    </td>
                    <td className="py-4 text-slate-100">{entry.username}</td>
                    <td className="py-4">
                      ${Number(entry.account_value).toFixed(2)}
                    </td>
                    <td
                      className={`py-4 ${entry.total_pl >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      ${Number(entry.total_pl).toFixed(2)}
                    </td>
                    <td
                      className={`py-4 ${entry.return_percent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {Number(entry.return_percent).toFixed(2)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Leaderboard will appear after users trade.
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
