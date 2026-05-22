import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import BottomTabBar from "@/components/BottomTabBar";
import Index from "./pages/Index";
import Portal from "./pages/Portal";
import Pricing from "./pages/Pricing";
import Blueprint from "./pages/Blueprint";
import Sovereign from "./pages/Sovereign";
import Lenses from "./pages/Triad";
import Library from "./pages/Library";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Account from "./pages/Account";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Refund from "./pages/Refund";
import Disclaimer from "./pages/Disclaimer";
import About from "./pages/About";
import TransitionQuiz from "./pages/TransitionQuiz";
import Pulse from "./pages/Pulse";
import MoonSignHoroscope from "./pages/MoonSignHoroscope";
import LunarClimate from "./pages/LunarClimate";
import LunarCycleTracking from "./pages/LunarCycleTracking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <BottomTabBar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/moon-sign-horoscope" element={<MoonSignHoroscope />} />
            <Route path="/lunar-climate" element={<LunarClimate />} />
            <Route path="/lunar-cycle-tracking" element={<LunarCycleTracking />} />
            <Route path="/login" element={<Portal defaultMode="login" />} />
            <Route path="/signup" element={<Portal defaultMode="signup" />} />
            {/* Legacy redirect */}
            <Route path="/portal" element={<Navigate to="/login" replace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blueprint" element={
              <ProtectedRoute>
                <Blueprint />
              </ProtectedRoute>
            } />
            <Route path="/sovereign" element={
              <ProtectedRoute>
                <Sovereign />
              </ProtectedRoute>
            } />
            <Route path="/lenses" element={
              <ProtectedRoute>
                <Lenses />
              </ProtectedRoute>
            } />
            <Route path="/triad" element={<Navigate to="/lenses" replace />} />
            <Route path="/library" element={<Library />} />
            <Route path="/account" element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            } />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/about" element={<About />} />
            <Route path="/transition-quiz" element={<TransitionQuiz />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<ResetPassword />} />
            <Route path="/welcome-sovereign" element={
              <ProtectedRoute>
                <SubscriptionSuccess />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
