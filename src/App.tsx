import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import MindmapHome from "@/pages/MindmapHome";
import CategoryPage from "@/pages/CategoryPage";
import GoalDetailPage from "@/pages/GoalDetailPage";
import RoutinePage from "@/pages/RoutinePage";
import FinancePage from "@/pages/FinancePage";
import MantraPage from "@/pages/MantraPage";
import AuthPage from "@/pages/AuthPage";
import ReviewPage from "@/pages/ReviewPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<MindmapHome />} />
              <Route path="/category/:key" element={<CategoryPage />} />
              <Route path="/category/:key/goal/:id" element={<GoalDetailPage />} />
              <Route path="/routine" element={<RoutinePage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/mantra" element={<MantraPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
