import { useState } from "react";
import ManifoldCanvas from "@/components/manifold/ManifoldCanvas";
import TimelineView from "@/components/manifold/TimelineView";
import MetricsBar from "@/components/manifold/MetricsBar";
import { Workflow, CalendarRange } from "lucide-react";

type ViewMode = "manifold" | "timeline";

export default function MindmapHome() {
  const [mode, setMode] = useState<ViewMode>(
    (localStorage.getItem("manifold_view_mode") as ViewMode) || "manifold"
  );
  const setView = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem("manifold_view_mode", m);
  };

  return (
    <div className="animate-fade-up relative">
      <MetricsBar />

      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Manifold</p>
          <p className="text-[13px] text-muted-foreground/80 mt-0.5">목표를 노드로, 흐름을 엣지로 — 선순환 시스템</p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card/40 p-0.5">
          <button
            onClick={() => setView("manifold")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] transition-colors ${
              mode === "manifold" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            title="플라이휠"
          >
            <Workflow className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView("timeline")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] transition-colors ${
              mode === "timeline" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            title="타임라인"
          >
            <CalendarRange className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {mode === "manifold" ? <ManifoldCanvas /> : <TimelineView />}

      <p className="text-center text-[12px] text-muted-foreground italic mt-4">
        잠재의식은 매일의 작은 행동으로 현실이 된다.
      </p>
    </div>
  );
}
