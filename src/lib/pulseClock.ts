import { useEffect, useState } from "react";
import { computeTriadMoon, type TriadMoon } from "@/lib/sovereignEngine";
import { getTestDate, subscribeTestDate, utcNoon } from "@/lib/testMode";

/* The one clock behind every Moon reading on Pulse and Lenses.
 * Respects Test Mode (footer toggle) and the optional UTC-noon anchor. */

export function resolvePulseNow(opts: { at?: Date; useUtcNoon?: boolean } = {}): Date {
  const { at, useUtcNoon = false } = opts;
  if (at) return at;
  const test = getTestDate();
  if (test) return useUtcNoon ? utcNoon(test) : test;
  return useUtcNoon ? utcNoon(new Date()) : new Date();
}

/* Triad cache: one bucket per UTC hour, keyed by hour. */
const triadCache = new Map<string, TriadMoon>();
export function cachedTriad(at: Date): TriadMoon {
  const key = `${at.getUTCFullYear()}-${at.getUTCMonth()}-${at.getUTCDate()}-${at.getUTCHours()}`;
  let v = triadCache.get(key);
  if (!v) {
    v = computeTriadMoon(at);
    triadCache.set(key, v);
    if (triadCache.size > 64) {
      const firstKey = triadCache.keys().next().value;
      if (firstKey) triadCache.delete(firstKey);
    }
  }
  return v;
}

/** Live "now" that follows Test Mode changes and refreshes every five minutes. */
export function usePulseNow(): Date {
  const [now, setNow] = useState<Date>(() => resolvePulseNow());
  useEffect(() => {
    const refresh = () => setNow(resolvePulseNow());
    const unsub = subscribeTestDate(refresh);
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, []);
  return now;
}
