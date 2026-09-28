import React, { useState, useEffect } from 'react';
import { ZodiacSignTransit } from '../types';
import { X, Save, Sparkles, Send, RefreshCw, Image as ImageIcon, Calendar } from 'lucide-react';
import { getDefaultTransitImageUrl } from '../lib/transitImages';

interface TransitDetailModalProps {
  transit: ZodiacSignTransit | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveContent: (id: string, updates: Partial<ZodiacSignTransit>) => void;
  onApprove: (id: string) => void;
}

export const TransitDetailModal: React.FC<TransitDetailModalProps> = ({
  transit,
  isOpen,
  onClose,
  onSaveContent,
  onApprove
}) => {
  const [copy, setCopy] = useState(transit?.copy || '');
  const [aspect, setAspect] = useState(transit?.transitAspect || '');
  const [transitDate, setTransitDate] = useState(transit?.transitDate || transit?.transit_date || '');
  const [powerHour, setPowerHour] = useState(transit?.powerHour || '');
  const [ritualTip, setRitualTip] = useState(transit?.ritualTip || '');
  const [imageUrl, setImageUrl] = useState(transit?.imageUrl || transit?.image_url || (transit ? getDefaultTransitImageUrl(transit.id) : ''));
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (transit) {
      setCopy(transit.copy);
      setAspect(transit.transitAspect);
      setTransitDate(transit.transitDate || transit.transit_date || '');
      setPowerHour(transit.powerHour);
      setRitualTip(transit.ritualTip);
      setImageUrl(transit.imageUrl || transit.image_url || getDefaultTransitImageUrl(transit.id));
      setIsSavedNotice(false);
    }
  }, [transit]);

  if (!isOpen || !transit) return null;

  const handleSave = () => {
    onSaveContent(transit.id, {
      copy,
      transitAspect: aspect,
      transitDate,
      transit_date: transitDate,
      powerHour,
      ritualTip,
      imageUrl,
      image_url: imageUrl,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const isPublished = transit.status === 'published';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xl shadow-inner">
              {transit.symbol}
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                {transit.sign}
                <span className="text-xs text-slate-400 font-normal">({transit.dates})</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isPublished ? 'Published' : 'Pending Approval'}
                </span>
              </h3>
              <div className="text-xs text-indigo-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                <span>Element: {transit.element} • Ruler: {transit.ruler}</span>
                {(transitDate || transit.transitDate || transit.transit_date) && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-200 font-semibold flex items-center gap-1 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Transit Date: {transitDate || transit.transitDate || transit.transit_date}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Astrological Transit Aspect / Frequency:
              </label>
              <input
                type="text"
                value={aspect}
                onChange={(e) => setAspect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Upcoming Transit Date / Window:
              </label>
              <input
                type="text"
                value={transitDate}
                placeholder="e.g. Sep 28 – Sep 30"
                onChange={(e) => setTransitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Daily Astrological Copy:
            </label>
            <textarea
              rows={4}
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Power Hour Window:
              </label>
              <input
                type="text"
                value={powerHour}
                onChange={(e) => setPowerHour(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Daily Ritual Tip:
              </label>
              <input
                type="text"
                value={ritualTip}
                onChange={(e) => setRitualTip(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Branded Transit Image URL (Instagram & Social Syndication):</span>
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://.../storage/v1/object/public/transit-images/aries.png"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden relative flex items-center justify-center flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={transit.sign}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <span className="absolute text-xs opacity-70 pointer-events-none">{transit.symbol}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Mapped to Supabase Storage <code className="text-indigo-400 font-mono">transit-images/{transit.id}.png</code> for Make.com distribution.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Associated Distribution Hashtags:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {transit.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 text-xs font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {isSavedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Content updates saved to state and queued for Supabase persistence!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(transit.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                isPublished
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              }`}
            >
              {isPublished ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Revoke to Pending</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve for Syndication</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
