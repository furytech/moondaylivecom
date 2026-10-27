import React, { useState, useMemo } from 'react';
import { ZodiacSignTransit } from '../types';
import { getTransitWindowDetailsForSign } from '../lib/moonTransitions';
import { useMoonTransitions, windowsFromTransitions } from '../lib/socialSchedule';
import { stateOf } from '../services/transitService';
import { formatPostTime, type SocialState, type SocialStatus } from '../../supabase/functions/_shared/socialDue';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  CheckCheck,
  Calendar,
  ArrowUpDown,
  History,
  ChevronDown,
  Undo2,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';

export type TransitSortOrder = 'current-to-future' | 'future-to-current';

const SESSION_SORT_KEY = 'moonday_mission_control_transit_sort';

function getInitialSortOrder(): TransitSortOrder {
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem(SESSION_SORT_KEY);
      if (saved === 'current-to-future' || saved === 'future-to-current') {
        return saved;
      }
    } catch {
      // sessionStorage unavailable
    }
  }
  return 'current-to-future';
}

interface TransitReviewPanelProps {
  transits: ZodiacSignTransit[];
  onApprove: (id: string) => void;
  onUndo?: (id: string) => void;
  onBatchApprove: () => void;
  onUndoAll?: () => void;
  onSelectTransit: (transit: ZodiacSignTransit) => void;
  onInspectPayload: (transit: ZodiacSignTransit) => void;
  selectedTransitId?: string;
  isActionLoading?: boolean;
}

const BADGE: Record<SocialState, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Approved', className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
  posted: { label: 'Posted', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  missed: { label: 'Missed', className: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
};

export const TransitReviewPanel: React.FC<TransitReviewPanelProps> = ({
  transits,
  onApprove,
  onUndo,
  onBatchApprove,
  onUndoAll,
  onSelectTransit,
  onInspectPayload,
  selectedTransitId,
  isActionLoading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'posted'>('all');
  const [sortOrder, setSortOrder] = useState<TransitSortOrder>(getInitialSortOrder);
  const [isPastExpanded, setIsPastExpanded] = useState<boolean>(false);

  const handleSortChange = (newOrder: TransitSortOrder) => {
    setSortOrder(newOrder);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_SORT_KEY, newOrder);
      } catch {
        // sessionStorage unavailable
      }
    }
  };

  // Real ingress instants from public.moon_transitions (matching BlogAdmin pattern)
  const { data: transitions = [] } = useMoonTransitions();
  const windows = useMemo(() => windowsFromTransitions(transitions), [transitions]);

  // Enrich each transit with dynamic transit window details and its derived social state
  const items = useMemo(() => {
    const now = Date.now();
    return transits.map((transit) => {
      const fallbackPeriod = transit.transit_period || transit.transitDate || transit.transit_date || '';
      const details = getTransitWindowDetailsForSign(transit.sign, transitions, fallbackPeriod);
      return {
        transit: { ...transit, transit_period: details.period || fallbackPeriod },
        details,
        status: stateOf(transit, windows, now),
      };
    });
  }, [transits, transitions, windows]);

  const count = (state: SocialState) => items.filter((i) => i.status.state === state).length;
  const pendingCount = count('pending');
  const approvedCount = count('approved');
  const postedCount = count('posted');
  const missedCount = count('missed');

  // Scheduled queue: approved cards by post time until they post, then missed cards (marked) after them
  const queue = useMemo(() => {
    const approved = items
      .filter((i) => i.status.state === 'approved')
      .sort((a, b) => (a.status.postAt ?? Infinity) - (b.status.postAt ?? Infinity) || a.transit.sign.localeCompare(b.transit.sign));
    const missed = items
      .filter((i) => i.status.state === 'missed')
      .sort((a, b) => Date.parse(b.status.window?.end_time ?? '') - Date.parse(a.status.window?.end_time ?? ''));
    return [...approved, ...missed];
  }, [items]);

  // Everything else (Pending and Posted) is listed below, filtered by the tabs
  const gridItems = useMemo(
    () =>
      items.filter(({ status }) => {
        if (status.state === 'approved' || status.state === 'missed') return false;
        if (filter === 'pending') return status.state === 'pending';
        if (filter === 'posted') return status.state === 'posted';
        return true;
      }),
    [items, filter]
  );

  const sortedActive = useMemo(() => gridItems.filter(({ details }) => details.status !== 'past'), [gridItems]);
  const sortedPast = useMemo(() => gridItems.filter(({ details }) => details.status === 'past'), [gridItems]);

  // Sort comparator based on transit date window
  const sortComparator = (
    a: { transit: ZodiacSignTransit; details: { start: Date; end: Date } },
    b: { transit: ZodiacSignTransit; details: { start: Date; end: Date } }
  ) => {
    const timeA = a.details.start.getTime();
    const timeB = b.details.start.getTime();
    if (timeA !== timeB) {
      return sortOrder === 'current-to-future' ? timeA - timeB : timeB - timeA;
    }
    return a.transit.sign.localeCompare(b.transit.sign);
  };

  const orderedActive = useMemo(() => [...sortedActive].sort(sortComparator), [sortedActive, sortOrder]);
  const orderedPast = useMemo(() => [...sortedPast].sort(sortComparator), [sortedPast, sortOrder]);

  const renderCard = (transit: ZodiacSignTransit, status: SocialStatus) => {
    const isSelected = selectedTransitId === transit.id;
    const periodDisplay = transit.transit_period || transit.transitDate || transit.transit_date || '';
    const badge = BADGE[status.state];
    const missed = status.state === 'missed';

    return (
      <div
        key={transit.id}
        onClick={() => onSelectTransit(transit)}
        className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${
          isSelected
            ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
            : missed
            ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/40'
            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 overflow-hidden relative flex items-center justify-center text-lg shadow-inner flex-shrink-0">
              {transit.imageUrl ? (
                <img
                  src={transit.imageUrl}
                  alt={transit.sign}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to symbol glyph if image is not yet uploaded
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="absolute text-sm select-none opacity-80 pointer-events-none">{transit.symbol}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                {transit.sign}
                <span className="text-xs text-slate-500 font-normal">({transit.dates})</span>
              </h3>
              <p className="text-xs text-indigo-400 font-medium">
                {transit.transitAspect}
              </p>
              {periodDisplay && (
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-indigo-400/80 flex-shrink-0" />
                  <span>{periodDisplay}</span>
                </p>
              )}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${badge.className}`}
          >
            {status.state === 'posted' && <CheckCircle2 className="w-3 h-3" />}
            {status.state === 'pending' && <Clock className="w-3 h-3" />}
            {status.state === 'approved' && <Send className="w-3 h-3" />}
            {missed && <AlertTriangle className="w-3 h-3" />}
            {badge.label}
          </span>
        </div>

        {status.state === 'approved' && (
          <p className="mb-3 text-left text-xs font-medium text-indigo-300">
            {status.postAt === null
              ? 'No moon schedule loaded for this sign yet'
              : status.due
              ? 'Due now: posts at the next hourly check'
              : `Posts ${formatPostTime(status.postAt)}`}
          </p>
        )}
        {status.state === 'posted' && transit.socialPostedAt && (
          <p className="mb-3 text-left text-xs font-medium text-emerald-300">
            Posted {formatPostTime(Date.parse(transit.socialPostedAt))}
          </p>
        )}
        {missed && (
          <p className="mb-3 text-left text-xs font-medium text-rose-300">
            Missed: the transit ended and this was never posted
          </p>
        )}

        {/* Transit Copy Preview */}
        <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed text-left">
          {transit.copy}
        </p>

        {/* Card Meta details */}
        <div className="bg-slate-950/40 rounded-lg p-2.5 text-xs space-y-1.5 border border-slate-800/50 mb-3">
          <div className="flex justify-between text-slate-400">
            <span>Transit Period:</span>
            <span className="text-slate-200 font-mono">{periodDisplay}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Ritual Tip:</span>
            <span className="text-slate-200 truncate max-w-[180px]">{transit.ritualTip}</span>
          </div>
        </div>

        {/* Card Action Footer: one button, labeled with the action */}
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

          {status.state === 'pending' && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={(e) => {
                e.stopPropagation();
                onApprove(transit.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              Approve
            </button>
          )}
          {status.state === 'approved' && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={(e) => {
                e.stopPropagation();
                onUndo?.(transit.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50"
            >
              <Undo2 className="w-3 h-3" />
              Undo approval
            </button>
          )}
        </div>
      </div>
    );
  };

  const tabClass = (active: boolean, tone: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      active ? tone : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="space-y-6">
      {/* Top Banner / Mass actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Module 1: Operational Transit Queue
              </span>
              <span className="text-xs text-slate-500">
                12 Zodiac Signs Queue
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Daily Astrological Content Syndication
            </h2>
            <p className="text-sm text-slate-400 mt-1 text-left">
              Approving schedules the post. It goes out at the top of the hour the transit starts in (8:00 PM ET for transits that start between 10 PM and 7 AM). An hourly check sends every approved card that is due.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBatchApprove}
              disabled={pendingCount === 0 || isActionLoading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
                pendingCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/35 border border-indigo-500/30'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve all pending ({pendingCount})</span>
            </button>
            <button
              onClick={onUndoAll}
              disabled={approvedCount === 0 || isActionLoading || !onUndoAll}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border ${
                approvedCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <span>Undo all approved ({approvedCount})</span>
            </button>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          {([
            ['Pending', pendingCount, 'text-amber-400'],
            ['Approved', approvedCount, 'text-indigo-300'],
            ['Posted', postedCount, 'text-emerald-400'],
            ['Missed', missedCount, 'text-rose-300'],
          ] as const).map(([label, n, tone]) => (
            <div key={label} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-xs text-slate-400 font-medium">{label}</span>
              <div className="mt-1">
                <span className={`text-2xl font-bold ${tone}`}>{n}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled queue: approved cards by post time, then missed cards */}
      <section aria-labelledby="scheduled-queue-heading" className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="scheduled-queue-heading" className="flex items-center gap-2 text-base font-semibold text-white">
            <ListChecks className="w-4 h-4 text-indigo-400" />
            Scheduled queue
          </h2>
          <span className="text-xs text-slate-400">
            {approvedCount} approved{missedCount > 0 ? `, ${missedCount} missed` : ''}
          </span>
        </div>
        {queue.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.map(({ transit, status }) => renderCard(transit, status))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-left">Nothing is scheduled. Approve a card and it appears here until it posts.</p>
        )}
      </section>

      {/* Filter Tabs and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={tabClass(filter === 'all', 'bg-slate-800 text-white border border-slate-700')}
          >
            Pending and posted ({pendingCount + postedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={tabClass(filter === 'pending', 'bg-amber-500/10 text-amber-400 border border-amber-500/20')}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('posted')}
            className={tabClass(filter === 'posted', 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')}
          >
            Posted ({postedCount})
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sort:</span>
          </span>
          <div
            role="group"
            aria-label="Transit sort order"
            className="inline-flex rounded-lg bg-slate-950/80 p-0.5 border border-slate-800"
          >
            <button
              type="button"
              onClick={() => handleSortChange('current-to-future')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sortOrder === 'current-to-future'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-pressed={sortOrder === 'current-to-future'}
            >
              Current → Future
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('future-to-current')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sortOrder === 'future-to-current'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-pressed={sortOrder === 'future-to-current'}
            >
              Future → Current
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Current & Upcoming Transit Cards */}
      {orderedActive.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedActive.map(({ transit, status }) => renderCard(transit, status))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No current or upcoming transits in this view.</p>
        </div>
      )}

      {/* Collapsible Past Transits Section */}
      {orderedPast.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
          <button
            type="button"
            onClick={() => setIsPastExpanded(!isPastExpanded)}
            className="w-full min-h-[44px] flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:bg-slate-900 hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] transition-all text-left group"
            aria-expanded={isPastExpanded}
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white">
                Past Transits
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                {orderedPast.length}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                (Transits whose active window has concluded)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium normal-case tracking-normal text-slate-300 group-hover:text-white">
              <span>{isPastExpanded ? 'Hide details' : 'Show details'}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isPastExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {isPastExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orderedPast.map(({ transit, status }) => renderCard(transit, status))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
