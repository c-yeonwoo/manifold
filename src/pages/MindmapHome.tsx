import MindmapCanvas from "@/components/mindmap/MindmapCanvas";

export default function MindmapHome() {
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Vision Board</p>
        <h1 className="text-xl font-medium text-foreground mt-1">원하는 건 무엇이든 이뤄진다</h1>
      </div>
      <MindmapCanvas />
      <p className="text-center text-[12px] text-muted-foreground italic mt-4">
        잠재의식은 매일의 작은 행동으로 현실이 된다.
      </p>
    </div>
  );
}
