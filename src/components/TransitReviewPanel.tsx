import React, { useState } from 'react';
import { ZodiacSignTransit } from '../types';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Eye,
  CheckCheck
} from 'lucide-react';

interface TransitReviewPanelProps {
  transits: ZodiacSignTransit[];
  onApprove: (id: string) => void;
  onBatchApprove: () => void;
  onSelectTransit: (transit: ZodiacSignTransit) => void;
  onInspectPayload: (transit: ZodiacSignTransit) => void;
  selectedTransitId?: string;
  isActionLoading?: boolean;
}

export const TransitReviewPanel: React.FC<TransitReviewPanelProps> = ({
  transits,
  onApprove,
  onBatchApprove,
  onSelectTransit,
  onInspectPayload,
  selectedTransitId,
  isActionLoading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>('all');

  const publishedCount = transits.filter(t => t.status === 'published').length;
  const pendingCount = transits.filter(t => t.status === 'pending').length;
  const allPublished = pendingCount === 0;

  const filteredTransits = transits.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'published') return t.status === 'published';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Batch Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Module 1 — Operational Transit Queue
              </span>
              <span className="text-xs text-slate-500">
                12 Zodiac Signs Queue
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Daily Astrological Content Syndication
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Approving signs sets <code className="text-indigo-300">status = 'published'</code> in Supabase. The Make.com poller queries published records every 2 hours out-of-band.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBatchApprove}
              disabled={allPublished || isActionLoading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
                allPublished
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/35 border border-indigo-500/30'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All 12 Signs</span>
            </button>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 font-medium">Pending Review</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
              <Clock className="w-4 h-4 text-amber-400/60" />
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 font-medium">Ready for Poller</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-400">{publishedCount}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 font-medium">Poller Cadence</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-semibold text-slate-300">Every 2 Hours</span>
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Signs (12)
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'published'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Published ({publishedCount})
          </button>
        </div>
      </div>

      {/* Grid of 12 Transit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTransits.map((transit) => {
          const isSelected = selectedTransitId === transit.id;
          const isPublished = transit.status === 'published';

          return (
            <div
              key={transit.id}
              onClick={() => onSelectTransit(transit)}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-lg shadow-inner">
                    {transit.symbol}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                      {transit.sign}
                      <span className="text-xs text-slate-500 font-normal">({transit.dates})</span>
                    </h3>
                    <p className="text-xs text-indigo-400 font-medium">
                      {transit.transitAspect}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Published
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      Pending
                    </>
                  )}
                </span>
              </div>

              {/* Transit Copy Preview */}
              <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                {transit.copy}
              </p>

              {/* Card Meta details */}
              <div className="bg-slate-950/40 rounded-lg p-2.5 text-xs space-y-1.5 border border-slate-800/50 mb-3">
                <div className="flex justify-between text-slate-400">
                  <span>Power Hour:</span>
                  <span className="text-slate-200 font-mono">{transit.powerHour}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ritual Tip:</span>
                  <span className="text-slate-200 truncate max-w-[180px]">{transit.ritualTip}</span>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectPayload(transit);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Payload</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(transit.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isPublished
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Revoke
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Approve Sign
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
