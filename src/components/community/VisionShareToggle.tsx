import { useEffect, useState } from "react";
import { Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isVisionShared, shareVision, unshareVision } from "@/lib/community";
import type { Goal } from "@/lib/goals";
import { toast } from "sonner";

export default function VisionShareToggle({ goal }: { goal: Goal }) {
  const [shared, setShared] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isVisionShared(goal.id).then(setShared);
  }, [goal.id]);

  if (shared === null) return null;

  const click = async () => {
    setBusy(true);
    try {
      if (shared) {
        await unshareVision(goal.id);
        setShared(false);
        toast.success("비공개로 전환했어요");
      } else {
        await shareVision(goal);
        setShared(true);
        toast.success("커뮤니티에 공유됐어요");
      }
    } catch (e: any) {
      toast.error(e.message ?? "실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={click} disabled={busy} title={shared ? "공개 중" : "비공개"}>
      {shared ? <Globe className="w-3.5 h-3.5 mr-1" /> : <Lock className="w-3.5 h-3.5 mr-1" />}
      {shared ? "공개" : "공유"}
    </Button>
  );
}
