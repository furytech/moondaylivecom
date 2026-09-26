import React, { useState } from 'react';
import { ZodiacSignTransit } from '../types';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Wand2, 
  Copy, 
  Check, 
  ArrowRight,
  Flame,
  Feather,
  Hash,
  Compass,
  Lightbulb,
  Radio
} from 'lucide-react';

interface CosmicAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  transits: ZodiacSignTransit[];
  onApplyTransitUpdate?: (id: string, updates: Partial<ZodiacSignTransit>) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  generatedUpdates?: {
    transitId: string;
    sign: string;
    copy?: string;
    transitAspect?: string;
    powerHour?: string;
    ritualTip?: string;
    hashtags?: string[];
  };
}

export const CosmicAiAssistant: React.FC<CosmicAiAssistantProps> = ({
  isOpen,
  onClose,
  transits,
  onApplyTransitUpdate,
}) => {
  const [input, setInput] = useState('');
  const [selectedSignId, setSelectedSignId] = useState<string>(transits[0]?.id || 'aries');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Greetings, Commander! I am your Moonday Cosmic AI Assistant. I can help refine daily transit copy, generate lunar rituals, optimize power hours, or assess syndication readiness for the Make.com pipeline. How can I empower your broadcast today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const currentSign = transits.find((t) => t.id === selectedSignId) || transits[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (transitId: string, updates: Partial<ZodiacSignTransit>, msgId: string) => {
    if (onApplyTransitUpdate) {
      onApplyTransitUpdate(transitId, updates);
      setAppliedId(msgId);
      setTimeout(() => setAppliedId(null), 2500);
    }
  };

  const simulateAiResponse = (prompt: string, updates?: Message['generatedUpdates']) => {
    setIsTyping(true);
    setTimeout(() => {
      let replyText = '';

      if (prompt.toLowerCase().includes('syndication') || prompt.toLowerCase().includes('readiness') || prompt.toLowerCase().includes('audit')) {
        const publishedCount = transits.filter(t => t.status === 'published').length;
        const pendingCount = transits.filter(t => t.status === 'pending').length;
        replyText = `📡 **Syndication Pipeline Status Report**:\n• **Ready for Poller (status = 'published'):** ${publishedCount} / ${transits.length} signs\n• **Pending Review:** ${pendingCount} signs\n• **Make.com Frequency:** Out-of-band polling every 2 hours via make-social-bridge.\n${pendingCount > 0 ? `⚠️ You have ${pendingCount} signs pending approval. Use "Approve All 12 Signs" or approve individually before the next poller cycle.` : '✨ All 12 signs are published and primed for syndication!'}`;
      } else if (updates) {
        replyText = `✨ Here is an enhanced cosmic transmission for **${updates.sign}** with heightened harmonic resonance and syndication-ready formatting:`;
      } else {
        replyText = `I have analyzed the celestial alignments for your query: "${prompt}". The cosmic currents favor direct, evocative language that aligns with Moonday's sovereign branding. Let me know if you would like me to draft full transit copy for a specific zodiac sign!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          generatedUpdates: updates,
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    simulateAiResponse(userText);
  };

  // Quick Action: Elevate copy
  const handleEnhanceCopy = () => {
    if (!currentSign) return;

    const enhancedAspect = `${currentSign.element} Elevation Wave`;
    const enhancedCopy = `Cosmic currents intensify around ${currentSign.sign}. As the lunar frequencies harmonize with ${currentSign.ruler}, clarity replaces hesitation. Stand firmly in your authentic power today and let instinct guide your key decisions before twilight.`;
    const enhancedPowerHour = '09:30 AM EST';
    const enhancedRitual = `Light pure beeswax or cedar incense; recite a declaration of sovereign clarity while holding ${currentSign.element === 'Fire' ? 'carnelian' : currentSign.element === 'Earth' ? 'pyrite' : currentSign.element === 'Air' ? 'selenite' : 'aquamarine'}.`;
    const enhancedTags = [`#${currentSign.sign}Energy`, '#MoondayLive', '#CosmicSyndication', '#LunarFrequency', '#DailyAlignment'];

    const updates = {
      transitId: currentSign.id,
      sign: currentSign.sign,
      transitAspect: enhancedAspect,
      copy: enhancedCopy,
      powerHour: enhancedPowerHour,
      ritualTip: enhancedRitual,
      hashtags: enhancedTags,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'user',
        text: `Enhance astrological copy and rituals for ${currentSign.sign} (${currentSign.symbol})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    simulateAiResponse(`Enhance copy for ${currentSign.sign}`, updates);
  };

  // Quick Action: Audit pipeline
  const handleAuditPipeline = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'user',
        text: 'Audit syndication readiness for the Make.com poller',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    simulateAiResponse('Audit syndication readiness');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl h-[85vh] max-h-[800px] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Cosmic AI Assistant
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Mission Control Copilot
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated Copy Enhancement & Syndication Optimizer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs relative z-10 scrollbar-none">
          <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Quick Actions:
          </span>

          <select
            value={selectedSignId}
            onChange={(e) => setSelectedSignId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
          >
            {transits.map((t) => (
              <option key={t.id} value={t.id}>
                {t.symbol} {t.sign}
              </option>
            ))}
          </select>

          <button
            onClick={handleEnhanceCopy}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors shrink-0 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Refine Copy & Ritual</span>
          </button>

          <button
            onClick={handleAuditPipeline}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors shrink-0 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Audit Poller Status</span>
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-md'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-bl-sm shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Render Generated AI Transit Payload if available */}
                {msg.generatedUpdates && (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 bg-slate-900/80 p-3.5 rounded-xl border">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                      <span>Preview for {msg.generatedUpdates.sign}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {msg.generatedUpdates.transitAspect}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      "{msg.generatedUpdates.copy}"
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-950/40 p-2 rounded border border-slate-800/50">
                        <span className="text-slate-400 font-medium">Power Hour: </span>
                        <span className="text-indigo-300 font-mono">{msg.generatedUpdates.powerHour}</span>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded border border-slate-800/50">
                        <span className="text-slate-400 font-medium">Ritual: </span>
                        <span className="text-slate-200 truncate">{msg.generatedUpdates.ritualTip}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {msg.generatedUpdates.hashtags?.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-mono text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons to Apply or Copy */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleCopy(msg.generatedUpdates?.copy || '', msg.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy Text'}</span>
                      </button>

                      {onApplyTransitUpdate && (
                        <button
                          onClick={() => handleApply(msg.generatedUpdates!.transitId, {
                            copy: msg.generatedUpdates!.copy,
                            transitAspect: msg.generatedUpdates!.transitAspect,
                            powerHour: msg.generatedUpdates!.powerHour,
                            ritualTip: msg.generatedUpdates!.ritualTip,
                            hashtags: msg.generatedUpdates!.hashtags,
                          }, msg.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                        >
                          {appliedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Applied to {msg.generatedUpdates.sign}!</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>Apply to Sign</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950/70 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-sm p-4 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-100" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-200" />
                <span>Channeling cosmic insights...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950/90 border-t border-slate-800 flex gap-2 relative z-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask AI to refine copy for ${currentSign?.sign || 'any sign'} or query syndication status...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
