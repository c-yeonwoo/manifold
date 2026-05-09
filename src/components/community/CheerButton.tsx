import { useState } from "react";
import { toggleCheer, type CheerTarget } from "@/lib/community";
import { toast } from "sonner";

export default function CheerButton({
  type,
  id,
  initialCount,
  initiallyCheered,
}: {
  type: CheerTarget;
  id: string;
  initialCount: number;
  initiallyCheered: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [on, setOn] = useState(initiallyCheered);
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    // optimistic
    setOn(!on);
    setCount((c) => c + (on ? -1 : 1));
    try {
      await toggleCheer(type, id);
    } catch (e: any) {
      setOn(on);
      setCount(initialCount);
      toast.error(e.message ?? "응원 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handle}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] transition-colors ${
        on ? "bg-primary/15 text-primary" : "bg-secondary/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      <span>👏</span>
      <span className="font-mono">{count}</span>
    </button>
  );
}
