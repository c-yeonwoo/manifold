import { Outlet, Link } from "react-router-dom";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import { MantraProvider } from "@/lib/mantra-context";
import { RoutineProvider } from "@/lib/routine-context";
import MantraReader from "@/components/mantra/MantraReader";
import MantraTicker from "@/components/mantra/MantraTicker";
import { useAuth } from "@/lib/auth";
import { isGuest, disableGuest } from "@/lib/guest";

export default function AppLayout() {
  const { user } = useAuth();
  const guest = !user && isGuest();

  return (
    <MantraProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {guest && (
          <div className="h-8 bg-primary/10 border-b border-primary/20 text-[12px] flex items-center justify-center gap-3 text-primary shrink-0">
            <span>둘러보기 모드 — 데이터는 저장되지 않아요.</span>
            <Link
              to="/auth"
              onClick={() => disableGuest()}
              className="underline underline-offset-2 hover:text-foreground"
            >
              로그인하고 시작하기 →
            </Link>
          </div>
        )}
        <TopNav />
        <MantraTicker />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
            <Outlet />
          </main>
        </div>
        <MantraReader />
      </div>
    </MantraProvider>
  );
}
