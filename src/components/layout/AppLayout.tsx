import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import { MantraProvider } from "@/lib/mantra-context";
import MantraReader from "@/components/mantra/MantraReader";
import MantraTicker from "@/components/mantra/MantraTicker";

export default function AppLayout() {
  return (
    <MantraProvider>
      <div className="h-screen flex flex-col overflow-hidden">
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
