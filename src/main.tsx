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

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
