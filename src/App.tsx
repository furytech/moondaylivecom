import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import BottomTabBar from "@/components/BottomTabBar";
import DevTierPanel from "@/components/DevTierPanel";
import Index from "./pages/Index";
import Portal from "./pages/Portal";
import Pricing from "./pages/Pricing";
import Blueprint from "./pages/Blueprint";
import Sovereign from "./pages/Sovereign";
import Lenses from "./pages/Triad";
import Library from "./pages/Library";
import LibrarySign from "./pages/LibrarySign";
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
import FindMoonSign from "./pages/FindMoonSign";
import YourMoonSign from "./pages/YourMoonSign";
import SharedMoon from "./pages/SharedMoon";

// Dev only: the real Blueprint for a mocked member (see src/dev/BlueprintFixture.tsx). `import.meta.env.DEV` is a
// static false in production builds, so the fixture is never bundled or routable there.
const BlueprintFixture = import.meta.env.DEV ? lazy(() => import("./dev/BlueprintFixture")) : null;
import Pulse from "./pages/Pulse";
import MoonSignHoroscope from "./pages/MoonSignHoroscope";
import LunarClimate from "./pages/LunarClimate";
import LunarCycleTracking from "./pages/LunarCycleTracking";
import MyMoonCard from "./pages/MyMoonCard";
import OAuthConsent from "./pages/OAuthConsent";
import BirthdayMoonPhase from "./pages/BirthdayMoonPhase";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import MissionControl from "./pages/admin/MissionControl";

import GuestStudio from "./pages/GuestStudio";
import Transit from "./pages/Transit";
import IdleSessionGuard from "./components/IdleSessionGuard";
import TriadPreview from "./pages/TriadPreview";
import ConfirmLanding from "./components/ConfirmLanding";

const queryClient = new QueryClient();

// Synchronous top-level check: if URL hash carries recovery token, redirect directly to /reset-password
if (typeof window !== "undefined") {
  const hash = window.location.hash;
  if (hash && hash.includes("type=recovery")) {
    const pathname = window.location.pathname;
    if (!pathname.startsWith("/reset-password") && !pathname.startsWith("/auth/reset-password")) {
      window.location.replace(`/reset-password${hash}`);
    }
  }
}

// Router-level recovery handler: extracts access_token and manages session/routing
const AuthRecoveryHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || "";

      if (accessToken) {
        supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            .catch((err) => {
              console.error("Failed to set recovery session:", err);
            });
      }

      if (
          !location.pathname.startsWith("/reset-password") &&
          !location.pathname.startsWith("/auth/reset-password")
      ) {
        navigate(`/reset-password${hash}`, { replace: true });
      }
    }
  }, [location, navigate]);

  return null;
};

// Accounts are created from the birthday + email step. Old /signup links (and ?email= / ?from=) land there.
const SignupRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/find-my-moon-sign${search}`} replace />;
};

// All URLs are lowercase: a capital letter anywhere in the path redirects to the lowercase form.
const LowercasePath = () => {
  const { pathname, search, hash } = useLocation();
  if (pathname !== pathname.toLowerCase()) {
    return <Navigate to={`${pathname.toLowerCase()}${search}${hash}`} replace />;
  }
  return null;
};

export const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthRecoveryHandler />
            <ConfirmLanding />
            <LowercasePath />
            <ScrollToTop />
            <IdleSessionGuard />
            <BottomTabBar />
            <DevTierPanel />
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<Index />} />

              {/* Public App Routes */}
              <Route path="/pulse" element={<Pulse />} />
              <Route path="/moon-sign-horoscope" element={<MoonSignHoroscope />} />
              <Route path="/lunar-climate" element={<LunarClimate />} />
              <Route path="/lunar-cycle-tracking" element={<LunarCycleTracking />} />
              <Route path="/birthday-moon-phase" element={<BirthdayMoonPhase />} />
              <Route path="/transit/:sign" element={<Transit />} />
              <Route path="/transit" element={<Navigate to="/transit/aries" replace />} />
              <Route path="/login" element={<Portal />} />
              <Route path="/find-my-moon-sign" element={<FindMoonSign />} />
              <Route path="/signup" element={<SignupRedirect />} />
              <Route path="/your-moon-sign" element={<YourMoonSign />} />
              <Route path="/shared-moon/:sign" element={<SharedMoon />} />
              {BlueprintFixture &&
                ["blueprint", "lenses", "pulse"].map((page) => (
                  <Route
                    key={page}
                    path={`/dev/${page}`}
                    element={
                      <Suspense fallback={null}>
                        <BlueprintFixture />
                      </Suspense>
                    }
                  />
                ))}
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:category/:slug" element={<BlogPost />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* Mission Control Admin Dashboard (gated at /admin) */}
              <Route path="/admin" element={<MissionControl />} />
              <Route path="/admin/mission-control" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/blog" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/subscribers" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/channel-audit" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/errors" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/guests" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/guest-applications" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/eclipse-campaign" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

              <Route path="/guest" element={
                                      <ProtectedRoute>
                                       <GuestStudio />
                                     </ProtectedRoute>
                                   } />

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
              <Route path="/triad-preview" element={<TriadPreview />} />
              <Route path="/luminary" element={<Navigate to="/pricing" replace />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/:slug" element={<LibrarySign />} />
              <Route path="/my-moon-card" element={
                                             <ProtectedRoute>
                                              <MyMoonCard />
                                            </ProtectedRoute>
                                          } />
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
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<ResetPassword />} />
              <Route path="/welcome-sovereign" element={
                                                  <ProtectedRoute>
                                                   <SubscriptionSuccess />
                                                 </ProtectedRoute>
                                               } />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;