import React, { useState, useEffect } from 'react';
import { INITIAL_TRANSIT_QUEUE } from './mocks/transitQueue';
import { ZodiacSignTransit } from './types';
import { 
  approveTransit, 
  batchApproveAllTransits, 
  updateTransitContent 
} from './services/transitService';
import { supabase } from './lib/supabase';
import { TransitReviewPanel } from './components/TransitReviewPanel';
import { TransitDetailModal } from './components/TransitDetailModal';
import { SocialQueueModal } from './components/SocialQueueModal';
import { AdminLogin, MASTER_ADMIN_EMAIL } from './components/AdminLogin';
import { CosmicAiAssistant } from './components/CosmicAiAssistant';
import { Moon, Database, LogOut, Sparkles, UserCheck, Shield } from 'lucide-react';
import type { Session, User } from '@supabase/supabase-js';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mockAuthenticated, setMockAuthenticated] = useState(false);

  const [transits, setTransits] = useState<ZodiacSignTransit[]>(INITIAL_TRANSIT_QUEUE);
  const [selectedTransit, setSelectedTransit] = useState<ZodiacSignTransit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [inspectingTransit, setInspectingTransit] = useState<ZodiacSignTransit | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and listen to Supabase Auth state
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          // If no Supabase environment keys, defer to login form mock handler
          if (mounted) setAuthLoading(false);
          return;
        }

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setAuthLoading(false);
        }
      } catch (err) {
        console.error('Error fetching Supabase session:', err);
        if (mounted) setAuthLoading(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setSession(null);
      setUser(null);
      setMockAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Check master admin permission
  const isMasterAdmin = 
    mockAuthenticated || 
    (user?.email && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());

  // Approve a single transit
  const handleApprove = async (id: string) => {
    setIsLoading(true);
    const result = await approveTransit(id, transits);
    if (result.success) {
      setTransits(result.updatedTransits);
      if (selectedTransit?.id === id) {
        const updated = result.updatedTransits.find((t) => t.id === id);
        if (updated) setSelectedTransit(updated);
      }
    }
    setIsLoading(false);
  };

  // Batch approve all 12 signs
  const handleBatchApprove = async () => {
    setIsLoading(true);
    const result = await batchApproveAllTransits(transits);
    if (result.success) {
      setTransits(result.updatedTransits);
    }
    setIsLoading(false);
  };

  // Save edited copy/aspect/rituals
  const handleSaveContent = async (id: string, updates: Partial<ZodiacSignTransit>) => {
    const result = await updateTransitContent(id, updates, transits);
    if (result.success) {
      setTransits(result.updatedTransits);
      const updated = result.updatedTransits.find((t) => t.id === id);
      if (updated) setSelectedTransit(updated);
    }
  };

  const handleSelectTransit = (transit: ZodiacSignTransit) => {
    setSelectedTransit(transit);
    setIsDetailModalOpen(true);
  };

  const handleInspectPayload = (transit: ZodiacSignTransit) => {
    setInspectingTransit(transit);
  };

  // Render loading state while checking session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Verifying Sovereign Session...
        </span>
      </div>
    );
  }

  // Render Master Admin Login Gate if not authenticated or not authorized
  if (!isMasterAdmin) {
    return (
      <AdminLogin
        allowedEmail={MASTER_ADMIN_EMAIL}
        onSuccessfulAuth={() => setMockAuthenticated(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                MOONDAY <span className="text-indigo-400 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">Mission Control</span>
              </h1>
              <p className="text-xs text-slate-400">Admin Operations & Syndication Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Assistant Launcher Button */}
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-violet-600/30 hover:from-indigo-600/40 hover:to-violet-600/40 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Features</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero-Webhook Architecture</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Live Seam</span>
            </div>

            {/* Authenticated Admin Badge & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="font-mono text-slate-300 truncate max-w-[150px]">
                  {user?.email || MASTER_ADMIN_EMAIL}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                title="Sign Out of Mission Control"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-400 border border-slate-700/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TransitReviewPanel
          transits={transits}
          onApprove={handleApprove}
          onBatchApprove={handleBatchApprove}
          onSelectTransit={handleSelectTransit}
          onInspectPayload={handleInspectPayload}
          selectedTransitId={selectedTransit?.id}
          isActionLoading={isLoading}
        />
      </main>

      {/* Detail / Content Editor Modal */}
      <TransitDetailModal
        transit={selectedTransit}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSaveContent={handleSaveContent}
        onApprove={handleApprove}
      />

      {/* Supabase Row Payload Inspector Modal */}
      <SocialQueueModal
        transit={inspectingTransit}
        onClose={() => setInspectingTransit(null)}
      />

      {/* Cosmic AI Assistant Panel */}
      <CosmicAiAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        transits={transits}
        onApplyTransitUpdate={handleSaveContent}
      />
    </div>
  );
}

export default App;
