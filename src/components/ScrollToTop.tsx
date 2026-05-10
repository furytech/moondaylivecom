import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // Defer slightly so document.title reflects the new route
    const id = window.setTimeout(() => {
      trackPageView(pathname + search);
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
