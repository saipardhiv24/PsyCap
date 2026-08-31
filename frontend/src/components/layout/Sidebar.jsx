import { NavLink } from "react-router-dom";
import { navItems } from "./navConfig.js";
import { Logo } from "../ui/primitives.jsx";
import { LogoutIcon } from "../ui/icons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-primary-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-negative-muted hover:text-negative"
        >
          <LogoutIcon className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
