import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "루틴" },
  { to: "/economy", label: "경제 공부" },
  { to: "/japanese", label: "일본어" },
  { to: "/english", label: "영어" },
  { to: "/health", label: "헬스" },
  { to: "/finance", label: "지출" },
  { to: "/property", label: "부동산" },
  { to: "/reading", label: "독서" },
  { to: "/portfolio", label: "포트폴리오" },
];

export default function TopNav() {
  return (
    <nav className="h-12 border-b border-border bg-card flex items-center px-6 gap-1 shrink-0">
      <span className="font-mono text-primary font-medium tracking-tight mr-6 text-sm">
        DAILY OS
      </span>
      <div className="flex gap-1">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
