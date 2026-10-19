import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initClarity } from "./lib/clarity";

// Defer Clarity until the main thread is idle so LCP stays clean.
if (typeof window !== "undefined") {
  const boot = () => initClarity();
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(boot, { timeout: 3000 });
  } else {
    setTimeout(boot, 1500);
  }
}

// Pages whose content is already in the served HTML keep it until the app has its own to show.
const rootEl = document.getElementById("root")!;
if (rootEl.dataset.prerendered) {
  (window as any).__PRERENDERED__ = { path: window.location.pathname, html: rootEl.innerHTML };
}

createRoot(rootEl).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
