import { useState } from "react";
import { Link } from "react-router-dom";
import MindmapCanvas from "@/components/mindmap/MindmapCanvas";
import MandalaGrid from "@/components/mindmap/MandalaGrid";
import LifeVisionCard from "@/components/mindmap/LifeVisionCard";
import { Network, LayoutGrid, ClipboardList } from "lucide-react";

type ViewMode = "mindmap" | "grid";

export default function MindmapHome() {
  const [mode, setMode] = useState<ViewMode>(
    (localStorage.getItem("vision_view_mode") as ViewMode) || "mindmap"
  );
  const setView = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem("vision_view_mode", m);
  };

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Vision Board</p>
        <h1 className="text-xl font-medium text-foreground mt-1">원하는 건 무엇이든 이뤄진다</h1>
      </div>

      <LifeVisionCard />

      {/* Toggle bar */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-border bg-card/40 p-0.5">
          <button
            onClick={() => setView("mindmap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] transition-colors ${
              mode === "mindmap"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Network className="w-3.5 h-3.5" /> 마인드맵
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] transition-colors ${
              mode === "grid"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> 만다라
          </button>
        </div>
        <Link
          to="/review"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" /> 분기 회고
        </Link>
      </div>

      {mode === "mindmap" ? <MindmapCanvas /> : <MandalaGrid />}

      <p className="text-center text-[12px] text-muted-foreground italic mt-4">
        잠재의식은 매일의 작은 행동으로 현실이 된다.
      </p>
    </div>
  );
}
