import { useCallback, useEffect, useRef, useState } from "react";

export const IDLE_LIMIT_MS = 15 * 60 * 1000; // hard logout
export const WARNING_AT_MS = 13 * 60 * 1000; // warning modal
export const COUNTDOWN_SECONDS = Math.round((IDLE_LIMIT_MS - WARNING_AT_MS) / 1000);

const CHANNEL_NAME = "moonday-idle";
const STORAGE_KEY = "moonday:lastActivityAt";
const THROTTLE_MS = 5000;

type IdleState = {
  warning: boolean;
  secondsLeft: number;
  stayLoggedIn: () => void;
};

/**
 * Tracks user inactivity across tabs and fires `onTimeout` after 15 idle minutes,
 * surfacing a warning at 13 minutes. Only active while `enabled` is true.
 */
export function useIdleLogout(enabled: boolean, onTimeout: () => void): IdleState {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const lastBroadcastRef = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const firedRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const markActive = useCallback((broadcast = true) => {
    const now = Date.now();
    lastActivityRef.current = now;
    firedRef.current = false;
    setWarning(false);
    setSecondsLeft(COUNTDOWN_SECONDS);

    if (broadcast && now - lastBroadcastRef.current > THROTTLE_MS) {
      lastBroadcastRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
        channelRef.current?.postMessage(now);
      } catch {
        /* storage unavailable — local timer still works */
      }
    }
  }, []);

  // Cross-tab sync
  useEffect(() => {
    if (!enabled) return;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        const ts = Number(event.data);
        if (Number.isFinite(ts) && ts > lastActivityRef.current) markActive(false);
      };
      channelRef.current = channel;
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const ts = Number(e.newValue);
      if (Number.isFinite(ts) && ts > lastActivityRef.current) markActive(false);
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
      channelRef.current = null;
    };
  }, [enabled, markActive]);

  // Activity listeners (throttled)
  useEffect(() => {
    if (!enabled) return;

    // Restore the last known activity time so idle survives reloads / tab close.
    let restored = 0;
    try {
      restored = Number(localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
      /* storage unavailable */
    }
    if (restored && Date.now() - restored < IDLE_LIMIT_MS) {
      lastActivityRef.current = restored;
      firedRef.current = false;
    } else if (restored) {
      // Already past the limit while away — expire immediately.
      lastActivityRef.current = restored;
      firedRef.current = true;
      onTimeoutRef.current();
      return;
    } else {
      markActive();
    }

    let throttled = false;
    const handler = () => {
      if (throttled) return;
      throttled = true;
      window.setTimeout(() => {
        throttled = false;
      }, 1000);
      markActive();
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [enabled, markActive]);


  // Tick
  useEffect(() => {
    if (!enabled) {
      setWarning(false);
      return;
    }
    const id = window.setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= IDLE_LIMIT_MS) {
        if (!firedRef.current) {
          firedRef.current = true;
          setWarning(false);
          onTimeoutRef.current();
        }
        return;
      }
      if (idle >= WARNING_AT_MS) {
        setWarning(true);
        setSecondsLeft(Math.max(0, Math.ceil((IDLE_LIMIT_MS - idle) / 1000)));
      } else if (idle < WARNING_AT_MS) {
        setWarning(false);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return { warning, secondsLeft, stayLoggedIn: () => markActive() };
}
