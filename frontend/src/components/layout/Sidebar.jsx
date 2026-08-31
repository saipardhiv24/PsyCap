import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/stocks", label: "Stocks" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/transactions", label: "Transactions" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const auth = useAuth();

  return (
    <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-col gap-4 p-6 bg-slate-950 border-r border-slate-800 text-slate-100">
      <div className="mb-8">
        <div className="text-2xl font-semibold text-slate-100">PsyCap</div>
        <p className="text-slate-400 mt-1 text-sm">
          Virtual stock market simulator
        </p>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-800 text-sky-300"
                  : "text-slate-300 hover:bg-slate-900"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={auth.signOut}
        className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 hover:border-slate-700"
      >
        Sign out
      </button>
    </aside>
  );
}
