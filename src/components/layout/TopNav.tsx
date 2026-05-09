import { NavLink, useLocation } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

const tabs = [
  { to: "/", label: "마인드맵" },
  { to: "/routine", label: "루틴" },
  { to: "/finance", label: "지출" },
  { to: "/mantra", label: "만트라" },
];

export default function TopNav() {
  const { pathname } = useLocation();
  return (
    <nav className="h-12 border-b border-border bg-card flex items-center px-6 gap-1 shrink-0">
      <span className="font-mono text-primary font-medium tracking-tight mr-6 text-sm">
        IAM
      </span>
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
      <ProfileMenu />
    </nav>
  );
}
