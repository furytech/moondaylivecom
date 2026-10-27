// Moon windows for the social schedule, as Mission Control needs them. The rule itself (post time, due, the
// four states) lives in supabase/functions/_shared/socialDue.ts and is shared with the sender, make-social-bridge.
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { MoonTransitionRow } from './moonTransitions';
import type { TransitWindow } from '../../supabase/functions/_shared/socialDue';

const FALLBACK_WINDOW_MS = 54 * 3600000;

/** Each ingress starts a window for its sign; it ends at the next ingress. */
export function windowsFromTransitions(rows: readonly MoonTransitionRow[]): TransitWindow[] {
  const sorted = [...rows].sort((a, b) => Date.parse(a.transition_at) - Date.parse(b.transition_at));
  return sorted.map((row, i) => {
    const start = Date.parse(row.transition_at);
    const end = i + 1 < sorted.length ? Date.parse(sorted[i + 1].transition_at) : start + FALLBACK_WINDOW_MS;
    return { sign: row.to_sign, start_time: new Date(start).toISOString(), end_time: new Date(end).toISOString() };
  });
}

/** Real ingress instants from public.moon_transitions (shared by the card list and the approve buttons). */
export function useMoonTransitions() {
  return useQuery({
    queryKey: ['admin-moon-transitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moon_transitions')
        .select('transition_at,from_sign,to_sign,transition_date')
        .order('transition_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MoonTransitionRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
