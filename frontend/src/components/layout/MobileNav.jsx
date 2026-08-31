import { NavLink } from "react-router-dom";
import { navItems } from "./navConfig.js";

export default function MobileNav() {
  const items = navItems.filter((item) => item.primary);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
