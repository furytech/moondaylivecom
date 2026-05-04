import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Fingerprint, Sparkles, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { path: "/", label: "Home", icon: Moon, protected: false },
  { path: "/blueprint", label: "Blueprint", icon: Fingerprint, protected: true },
  { path: "/sovereign", label: "Rituals", icon: Sparkles, protected: true },
  { path: "/account", label: "Account", icon: User, protected: true },
];

const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleClick = (
    e: React.MouseEvent,
    tab: { path: string; protected: boolean }
  ) => {
    if (tab.protected && !user) {
      e.preventDefault();
      navigate(`/login?from=${encodeURIComponent(tab.path)}`);
    }
  };

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Frosted obsidian bar with champagne hairline */}
      <div
        className="relative backdrop-blur-xl border-t"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--sov-obsidian-2) / 0.85), hsl(var(--sov-obsidian) / 0.92))",
          borderTopColor: "hsl(var(--sov-champagne) / 0.35)",
          boxShadow:
            "0 -8px 24px -12px hsl(var(--sov-obsidian) / 0.6), inset 0 1px 0 hsl(var(--sov-champagne) / 0.08)",
        }}
      >
        <ul className="flex items-stretch justify-around max-w-md mx-auto px-2">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            return (
              <li key={tab.path} className="flex-1">
                <Link
                  to={tab.path}
                  onClick={(e) => handleClick(e, tab)}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="group flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-transform duration-300 active:scale-95"
                  style={{
                    transform: active ? "translateY(-2px)" : "translateY(0)",
                  }}
                >
                  <Icon
                    strokeWidth={1.5}
                    className="w-6 h-6 transition-all duration-300"
                    style={{
                      color: active
                        ? "hsl(var(--sov-champagne))"
                        : "hsl(var(--sov-ivory) / 0.4)",
                      filter: active
                        ? "drop-shadow(0 0 6px hsl(var(--sov-champagne) / 0.7)) drop-shadow(0 0 14px hsl(var(--sov-champagne) / 0.35))"
                        : "none",
                    }}
                  />
                  <span
                    className="text-[9px] font-display uppercase tracking-widest transition-colors duration-300"
                    style={{
                      color: active
                        ? "hsl(var(--sov-champagne))"
                        : "hsl(var(--sov-ivory) / 0.4)",
                    }}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default BottomTabBar;
