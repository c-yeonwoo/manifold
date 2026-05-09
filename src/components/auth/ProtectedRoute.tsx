import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { isGuest } from "@/lib/guest";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground text-sm">
        불러오는 중…
      </div>
    );
  }
  if (!user && !isGuest()) {
    return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
