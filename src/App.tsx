import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import TransitionQuiz from "./pages/TransitionQuiz";
import Results from "./pages/Results";
import DevTest from "./pages/DevTest";
import Portal from "./pages/Portal";
import Blueprint from "./pages/Blueprint";
import Archives from "./pages/Archives";
import Atelier from "./pages/Atelier";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/quiz" element={<TransitionQuiz />} />
            <Route path="/results" element={<Results />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/blueprint" element={
              <ProtectedRoute>
                <Blueprint />
              </ProtectedRoute>
            } />
            <Route path="/archives" element={
              <ProtectedRoute>
                <Archives />
              </ProtectedRoute>
            } />
            <Route path="/atelier" element={
              <ProtectedRoute>
                <Atelier />
              </ProtectedRoute>
            } />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/dev" element={<DevTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
