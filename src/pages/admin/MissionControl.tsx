import React, { useState, useEffect } from 'react';
import { INITIAL_TRANSIT_QUEUE } from '../../mocks/transitQueue';
import { ZodiacSignTransit } from '../../types';
import { 
  fetchTransits,
  approveTransit, 
  batchApproveAllTransits, 
  updateTransitContent 
} from '../../services/transitService';
import { supabase } from '../../lib/supabase';
import { TransitReviewPanel } from '../../components/TransitReviewPanel';
import { TransitDetailModal } from '../../components/TransitDetailModal';
import { SocialQueueModal } from '../../components/SocialQueueModal';
import { AdminLogin, MASTER_ADMIN_EMAIL } from '../../components/AdminLogin';
import { CosmicAiAssistant } from '../../components/CosmicAiAssistant';
import { Moon, Database, LogOut, Sparkles, UserCheck, Shield } from 'lucide-react';
import type { Session, User } from '@supabase/supabase-js';

export function MissionControl() {
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

  // Fetch live transits from Supabase transits table on load / auth
  useEffect(() => {
    let active = true;

    async function loadLiveTransits() {
      if (!import.meta.env.VITE_SUPABASE_URL) return;
      try {
        const { data, error } = await fetchTransits();
        if (active && data && data.length > 0) {
          setTransits((prev) =>
            prev.map((item) => {
              const remote = data.find((d) => d.id === item.id);
              return remote ? { ...item, ...remote } : item;
            })
          );
        }
      } catch (err) {
        console.error('Error loading live transits from Supabase:', err);
      }
    }

    loadLiveTransits();

    return () => {
      active = false;
    };
  }, [session]);

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

  // Apply copy & rituals generated from Cosmic AI Assistant
  const handleApplyAiEnhancement = async (
    transitId: string, 
    enhancedCopy: string, 
    enhancedRitual: string, 
    optimizedPowerHour: string
  ) => {
    await handleSaveContent(transitId, {
      copy: enhancedCopy,
      ritualTip: enhancedRitual,
      powerHour: optimizedPowerHour
    });
  };

  // Show loading indicator during initial session check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
          <Moon className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium tracking-wide">Validating Cosmic Credentials...</p>
      </div>
    );
  }

  // Master Admin Authentication Gate: If unauthenticated or unauthorized email, render sleek login
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero-Webhook Architecture</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Live Seam</span>
            </div>

            {/* Launch AI Assistant button */}
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            {/* Master Admin Indicator & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-white flex items-center justify-end gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  Master Admin
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {user?.email || MASTER_ADMIN_EMAIL}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                title="Sign Out of Mission Control"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
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

      {/* Cosmic AI Assistant Copilot Modal */}
      <CosmicAiAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        transits={transits}
        onApplyEnhancement={handleApplyAiEnhancement}
      />
    </div>
  );
}

export default MissionControl;
