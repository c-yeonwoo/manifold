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
    <div className="animate-fade-up relative">
      {/* Top bar: title left/center, controls right */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1" />
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Vision Board</p>
          <div className="mt-1">
            <LifeVisionCard />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <div className="inline-flex rounded-md border border-border bg-card/40 p-0.5">
            <button
              onClick={() => setView("mindmap")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] transition-colors ${
                mode === "mindmap"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="마인드맵"
            >
              <Network className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] transition-colors ${
                mode === "grid"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="만다라"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <Link
            to="/review"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            title="분기 회고"
          >
            <ClipboardList className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {mode === "mindmap" ? <MindmapCanvas /> : <MandalaGrid />}

      <p className="text-center text-[12px] text-muted-foreground italic mt-4">
        잠재의식은 매일의 작은 행동으로 현실이 된다.
      </p>
    </div>
  );
}
