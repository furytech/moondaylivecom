import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_TRANSIT_QUEUE } from '../../mocks/transitQueue';
import { ZodiacSignTransit } from '../../types';
import { 
  fetchTransits,
  approveTransit, 
  batchApproveAllTransits, 
  updateTransitContent 
} from '../../services/transitService';
import { 
  listAllPosts, 
  upsertPost, 
  deletePost, 
  publishPostNow, 
  unpublishPost, 
  BlogPostRow 
} from '../../lib/blog/posts';
import { supabase } from '../../lib/supabase';
import { TransitReviewPanel } from '../../components/TransitReviewPanel';
import { TransitDetailModal } from '../../components/TransitDetailModal';
import { SocialQueueModal } from '../../components/SocialQueueModal';
import { BlogManagerPanel } from '../../components/admin/BlogManagerPanel';
import { BlogPostEditModal } from '../../components/admin/BlogPostEditModal';
import { AdminLogin, MASTER_ADMIN_EMAIL } from '../../components/AdminLogin';
import { CosmicAiAssistant } from '../../components/CosmicAiAssistant';
import { Moon, Database, LogOut, Sparkles, UserCheck, BookOpen, Layers, CheckCircle2, AlertCircle, AlertTriangle, X, Radio } from 'lucide-react';
import type { Session, User } from '@supabase/supabase-js';

export function MissionControl() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mockAuthenticated, setMockAuthenticated] = useState(false);

  // View tab: 'transits' | 'blog'
  const [activeTab, setActiveTab] = useState<'transits' | 'blog'>('transits');

  // Transits state
  const [transits, setTransits] = useState<ZodiacSignTransit[]>(INITIAL_TRANSIT_QUEUE);
  const [selectedTransit, setSelectedTransit] = useState<ZodiacSignTransit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [inspectingTransit, setInspectingTransit] = useState<ZodiacSignTransit | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Blog posts state
  const [blogPosts, setBlogPosts] = useState<BlogPostRow[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPostRow | null>(null);
  const [isBlogEditModalOpen, setIsBlogEditModalOpen] = useState(false);

  // Approval status feedback banner state
  const [approvalFeedback, setApprovalFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Make.com Webhook settings modal state
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [makeWebhookInput, setMakeWebhookInput] = useState(() => {
    return (
      import.meta.env.VITE_MAKE_WEBHOOK_URL ||
      (typeof window !== 'undefined' ? localStorage.getItem('moonday.makeWebhook') || '' : '')
    );
  });
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);

  // Auto-dismiss confirmation notification after 5 seconds
  useEffect(() => {
    if (!approvalFeedback) return;
    const timer = setTimeout(() => {
      setApprovalFeedback(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [approvalFeedback]);

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

  // Fetch live blog posts from Supabase blog_posts table
  const loadBlogPosts = useCallback(async () => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    setBlogLoading(true);
    try {
      const posts = await listAllPosts();
      setBlogPosts(posts);
    } catch (err) {
      console.error('Error loading blog posts from Supabase:', err);
    } finally {
      setBlogLoading(false);
    }
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
    loadBlogPosts();

    return () => {
      active = false;
    };
  }, [session, loadBlogPosts]);

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
    try {
      const result = await approveTransit(id, transits);
      if (result.success) {
        setTransits(result.updatedTransits);
        if (selectedTransit?.id === id) {
          const updated = result.updatedTransits.find((t) => t.id === id);
          if (updated) setSelectedTransit(updated);
        }
        // Refresh blog posts as an approved transit automatically publishes a blog post
        loadBlogPosts();
      }

      if (result.feedbackMessage) {
        setApprovalFeedback({
          type: result.feedbackType || (result.success ? 'success' : 'error'),
          message: result.feedbackMessage,
        });
      }
    } catch (err: unknown) {
      console.error('[MissionControl] Error approving transit:', err);
      const rawMessage = err instanceof Error ? err.message : String(err);
      const cleanMessage = rawMessage.replace(/^Failed to approve transit in Supabase:\s*/, '');
      setApprovalFeedback({
        type: 'error',
        message: `Could not approve. ${cleanMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Batch approve all 12 signs
  const handleBatchApprove = async () => {
    setIsLoading(true);
    try {
      const result = await batchApproveAllTransits(transits);
      if (result.success) {
        setTransits(result.updatedTransits);
        // Refresh blog posts as batch approval publishes all 12 signs to the journal
        loadBlogPosts();
      }
    } catch (err: unknown) {
      console.error('[MissionControl] Error batch approving transits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save edited copy/aspect/rituals
  const handleSaveContent = async (id: string, updates: Partial<ZodiacSignTransit>) => {
    try {
      const result = await updateTransitContent(id, updates, transits);
      if (result.success) {
        setTransits(result.updatedTransits);
        const updated = result.updatedTransits.find((t) => t.id === id);
        if (updated) setSelectedTransit(updated);
        loadBlogPosts();
      }
    } catch (err: unknown) {
      console.error('[MissionControl] Error saving transit content:', err);
    }
  };

  const handleSelectTransit = (transit: ZodiacSignTransit) => {
    setSelectedTransit(transit);
    setIsDetailModalOpen(true);
  };

  const handleInspectPayload = (transit: ZodiacSignTransit) => {
    setInspectingTransit(transit);
  };

  // Blog Management Handlers
  const handleCreateNewBlogPost = () => {
    setEditingBlogPost(null);
    setIsBlogEditModalOpen(true);
  };

  const handleSelectEditBlogPost = (post: BlogPostRow) => {
    setEditingBlogPost(post);
    setIsBlogEditModalOpen(true);
  };

  const handleSaveBlogPost = async (postData: Partial<BlogPostRow>) => {
    await upsertPost(postData);
    await loadBlogPosts();
  };

  const handleToggleBlogPublish = async (id: string, currentStatus: string) => {
    if (currentStatus === 'published') {
      await unpublishPost(id);
    } else {
      await publishPostNow(id);
    }
    await loadBlogPosts();
  };

  const handleDeleteBlogPost = async (id: string) => {
    await deletePost(id);
    await loadBlogPosts();
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
            <button
              type="button"
              onClick={() => setIsWebhookModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors"
              title="Configure Make.com Webhook URL"
            >
              <span className={`w-2 h-2 rounded-full ${makeWebhookInput ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-indigo-400" />
                Make.com Webhook
              </span>
            </button>

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

        {/* Section Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 flex items-center gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('transits')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'transits'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operational Transit Queue</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
              12 Signs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blog')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'blog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journal / Blog Manager</span>
            {blogPosts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                {blogPosts.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'transits' ? (
          <TransitReviewPanel
            transits={transits}
            onApprove={handleApprove}
            onBatchApprove={handleBatchApprove}
            onSelectTransit={handleSelectTransit}
            onInspectPayload={handleInspectPayload}
            selectedTransitId={selectedTransit?.id}
            isActionLoading={isLoading}
          />
        ) : (
          <BlogManagerPanel
            posts={blogPosts}
            loading={blogLoading}
            onSelectEditPost={handleSelectEditBlogPost}
            onCreateNewPost={handleCreateNewBlogPost}
            onPublishToggle={handleToggleBlogPublish}
            onDeletePost={handleDeleteBlogPost}
            onRefresh={loadBlogPosts}
          />
        )}
      </main>

      {/* Floating Status Notification Toast */}
      {approvalFeedback && (
        <div className="fixed top-20 right-6 z-[70] max-w-md w-full animate-in slide-in-from-top-4 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-start justify-between gap-3 ${
              approvalFeedback.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
                : approvalFeedback.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/40 text-amber-200 shadow-amber-950/50'
                : 'bg-rose-950/95 border-rose-500/40 text-rose-200 shadow-rose-950/50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {approvalFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : approvalFeedback.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  {approvalFeedback.type === 'success'
                    ? 'Syndication Dispatched'
                    : approvalFeedback.type === 'warning'
                    ? 'Webhook Notice'
                    : 'Approval Error'}
                </p>
                <p className="text-sm font-medium leading-snug">
                  {approvalFeedback.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setApprovalFeedback(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail / Transit Content Editor Modal */}
      <TransitDetailModal
        transit={selectedTransit}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSaveContent={handleSaveContent}
        onApprove={handleApprove}
        feedback={approvalFeedback}
        onDismissFeedback={() => setApprovalFeedback(null)}
      />

      {/* Blog Post Edit & Create Modal */}
      <BlogPostEditModal
        post={editingBlogPost}
        isOpen={isBlogEditModalOpen}
        onClose={() => setIsBlogEditModalOpen(false)}
        onSave={handleSaveBlogPost}
        onPublishToggle={handleToggleBlogPublish}
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

      {/* Make.com Webhook Settings Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Make.com Syndication Webhook</h3>
                  <p className="text-xs text-slate-400">Trigger scenario automatically on sign approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={makeWebhookInput}
                  onChange={(e) => setMakeWebhookInput(e.target.value)}
                  placeholder="https://hook.us1.make.com/your-custom-webhook-id"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  When you click <strong className="text-white">Approve Sign</strong>, Mission Control sends the full transit payload directly to this Make.com webhook endpoint.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5 text-slate-400">
                <span className="font-semibold text-slate-300 block">Feedback Behavior:</span>
                <p>• <span className="text-emerald-400 font-medium">HTTP 200/2xx:</span> "Approved. Sent to Make.com for syndication."</p>
                <p>• <span className="text-amber-400 font-medium">Unreachable/Timeout:</span> "Approval saved but Make.com webhook did not respond. Check your automation."</p>
                <p>• <span className="text-rose-400 font-medium">Database Failure:</span> "Could not approve. [error message]."</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingWebhook}
                onClick={async () => {
                  setIsSavingWebhook(true);
                  try {
                    localStorage.setItem('moonday.makeWebhook', makeWebhookInput.trim());
                    if (import.meta.env.VITE_SUPABASE_URL) {
                      await supabase
                        .from('system_settings')
                        .upsert({ key: 'make_webhook_url', value: makeWebhookInput.trim() }, { onConflict: 'key' });
                    }
                    setIsWebhookModalOpen(false);
                    setApprovalFeedback({
                      type: 'success',
                      message: 'Make.com webhook endpoint configured successfully.',
                    });
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    setApprovalFeedback({
                      type: 'error',
                      message: `Failed to save webhook URL: ${msg}`,
                    });
                  } finally {
                    setIsSavingWebhook(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isSavingWebhook ? 'Saving...' : 'Save Webhook URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MissionControl;
