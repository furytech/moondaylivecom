import React from 'react';
import { ZodiacSignTransit } from '../types';
import { X, Database } from 'lucide-react';

interface SocialQueueModalProps {
  transit: ZodiacSignTransit | null;
  onClose: () => void;
}

export const SocialQueueModal: React.FC<SocialQueueModalProps> = ({
  transit,
  onClose
}) => {
  if (!transit) return null;

  const dbPayload = {
    id: transit.id,
    sign: transit.sign,
    symbol: transit.symbol,
    element: transit.element,
    ruler: transit.ruler,
    dates: transit.dates,
    transit_title: transit.transitTitle,
    transit_aspect: transit.transitAspect,
    copy: transit.copy,
    power_hour: transit.powerHour,
    ritual_tip: transit.ritualTip,
    hashtags: transit.hashtags,
    status: transit.status,
    published_at: transit.publishedAt || null,
    social_posted_at: transit.socialPostedAt || null
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                Supabase Row Inspector: {transit.sign} ({transit.symbol})
              </h3>
              <p className="text-xs text-slate-400">
                Exact PostgreSQL record queried by Make.com via make-social-bridge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-400">Status in Database:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                transit.status === 'published'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {transit.status.toUpperCase()}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              PostgreSQL JSON Record:
            </label>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-indigo-300 overflow-x-auto">
              {JSON.stringify(dbPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
