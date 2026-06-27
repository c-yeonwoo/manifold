import { NavLink, useLocation } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import ThemeToggle from "./ThemeToggle";

const tabs = [
  { to: "/", label: "Manifold" },
  { to: "/mantra", label: "확언" },
  { to: "/finance", label: "지출" },
];

export default function TopNav() {
  const { pathname } = useLocation();
  return (
    <nav className="h-12 border-b border-border bg-card flex items-center px-6 gap-1 shrink-0">
      <div className="mr-6 flex items-baseline gap-2">
        <span className="font-mono text-[15px] font-semibold tracking-tight text-primary">
          manifold
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          base·core·output
        </span>
      </div>
      <div className="flex gap-1 flex-1">
        {tabs.map((t) => {
          const active =
            t.to === "/"
              ? pathname === "/" || pathname.startsWith("/category")
              : pathname.startsWith(t.to);
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
            </NavLink>
          );
        })}
      </div>
      <ThemeToggle />
      <ProfileMenu />
    </nav>
  );
}
