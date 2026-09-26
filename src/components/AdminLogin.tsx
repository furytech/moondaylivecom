import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Moon, Shield, Lock, Mail, ArrowRight, Sparkles, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onSuccessfulAuth?: () => void;
  allowedEmail?: string;
}

export const MASTER_ADMIN_EMAIL = 'mindglimmer@gmail.com';

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccessfulAuth,
  allowedEmail = MASTER_ADMIN_EMAIL,
}) => {
  const [email, setEmail] = useState(allowedEmail);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic_link'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== allowedEmail.toLowerCase()) {
      setErrorMsg(`Access restricted. Only Master Administrator (${allowedEmail}) is authorized to access Mission Control.`);
      return;
    }

    setIsLoading(true);

    try {
      // Check if Supabase credentials are configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Fallback for local development if keys are not set
        setInfoMsg('Operating in offline/local mock mode. Granting master session.');
        setTimeout(() => {
          onSuccessfulAuth?.();
        }, 600);
        setIsLoading(false);
        return;
      }

      if (mode === 'password') {
        if (!password) {
          setErrorMsg('Please enter your administrator password.');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }

        if (data.user?.email?.toLowerCase() !== allowedEmail.toLowerCase()) {
          await supabase.auth.signOut();
          setErrorMsg(`Unauthorized account. Access restricted to ${allowedEmail}.`);
          setIsLoading(false);
          return;
        }

        onSuccessfulAuth?.();
      } else {
        // Magic link
        const { error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setInfoMsg(`Cosmic authorization link dispatched to ${normalizedEmail}. Check your inbox.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during authentication.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/40 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-xl shadow-indigo-500/20 mb-4 border border-indigo-400/30">
            <Moon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            MOONDAY <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">Mission Control</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Master Administrator Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">Sovereign Gate</span>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {allowedEmail}
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="leading-relaxed">{infoMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Master Admin Email</span>
                <span className="text-slate-500 text-[11px]">Strict Whitelist</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@moondaylive.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {mode === 'password' && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all duration-200 border border-indigo-400/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Mission Control</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login Modes */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'password' ? 'magic_link' : 'password');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="text-slate-400 hover:text-indigo-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{mode === 'password' ? 'Use Magic Link Instead' : 'Use Password Instead'}</span>
            </button>

            <span className="text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Supabase Auth</span>
            </span>
          </div>
        </div>

        {/* Security Footer Notice */}
        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-600" />
          <span>Restricted to authorized Moonday Live operators only.</span>
        </p>
      </div>
    </div>
  );
};
