import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import RoutinePage from "@/pages/RoutinePage";
import EconomyPage from "@/pages/EconomyPage";
import JapanesePage from "@/pages/JapanesePage";
import EnglishPage from "@/pages/EnglishPage";
import HealthPage from "@/pages/HealthPage";
import FinancePage from "@/pages/FinancePage";
import PropertyPage from "@/pages/PropertyPage";
import ReadingPage from "@/pages/ReadingPage";
import PortfolioPage from "@/pages/PortfolioPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoutinePage />} />
            <Route path="/economy" element={<EconomyPage />} />
            <Route path="/japanese" element={<JapanesePage />} />
            <Route path="/english" element={<EnglishPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/property" element={<PropertyPage />} />
            <Route path="/reading" element={<ReadingPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
