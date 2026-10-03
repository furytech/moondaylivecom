import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["nav-admin-check", user?.id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });

  const isActive = (path: string) =>
    path === "/blog"
      ? location.pathname === "/blog" || location.pathname.startsWith("/blog/")
      : location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileMenuOpen(false);
  };

  // Same menu for everyone — protected items redirect to /login when unauth
  const navLinks = [
    { path: "/pulse", label: "Daily Pulse", protected: false },
    { path: "/blueprint", label: "Blueprint", protected: true },
    { path: "/lenses", label: "Lenses", protected: true },
    { path: "/library", label: "Library", protected: false },
    { path: "/pricing", label: "Pricing", protected: false },
    { path: "/blog", label: "Journal", protected: false },
    { path: "/account", label: "Account", protected: true },
  ];

  const handleNavClick = (e: React.MouseEvent, link: { path: string; protected: boolean }) => {
    if (link.protected && !user) {
      e.preventDefault();
      navigate(`/login?from=${encodeURIComponent(link.path)}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover-scale-subtle">
              <img
                src="/assets/MoondayLive-Logo.png"
                alt="Moonday"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-primary/30 shrink-0"
                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
              />
              <span className="font-display text-lg tracking-wider text-foreground hidden sm:block uppercase">
                MOONDAY
              </span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                title="Open Mission Control Admin"
                aria-label="Open Mission Control Admin"
                className={`flex items-center gap-2 border-l border-border/40 pl-3 font-display text-xs tracking-widest uppercase whitespace-nowrap transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "text-white font-bold [text-shadow:0_0_10px_hsl(var(--primary)/0.95)]"
                    : "text-primary hover:text-primary/80"
                }`}
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-x-5 xl:gap-x-6 lg:ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={(e) => handleNavClick(e, link)}
                className={`font-display text-[13px] xl:text-sm tracking-[0.18em] xl:tracking-widest uppercase whitespace-nowrap elegant-hover ${
                  isActive(link.path)
                    ? "text-white font-bold [text-shadow:0_0_10px_hsl(var(--primary)/0.95),0_0_22px_hsl(var(--primary)/0.7),0_0_40px_hsl(var(--primary)/0.4)]"
                    : "text-[hsl(var(--reveal)/0.8)] hover:text-[hsl(var(--reveal-strong))] transition-colors"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleSignOut}
                className="font-display text-[13px] xl:text-sm tracking-[0.18em] xl:tracking-widest uppercase whitespace-nowrap text-[hsl(var(--reveal)/0.8)] hover:text-[hsl(var(--reveal-strong))] transition-colors elegant-hover"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-display text-[13px] xl:text-sm tracking-[0.18em] xl:tracking-widest uppercase whitespace-nowrap text-[hsl(var(--reveal)/0.8)] hover:text-[hsl(var(--reveal-strong))] transition-colors elegant-hover"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="font-display text-[13px] xl:text-sm tracking-[0.18em] xl:tracking-widest uppercase whitespace-nowrap px-4 xl:px-5 py-2 art-deco-border brass-glow text-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-foreground p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-border/30 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={(e) => {
                    handleNavClick(e, link);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-display text-sm tracking-widest uppercase py-2 ${
                    isActive(link.path)
                      ? "text-white font-bold [text-shadow:0_0_10px_hsl(var(--primary)/0.95),0_0_22px_hsl(var(--primary)/0.6)]"
                      : "text-[hsl(var(--reveal)/0.8)] hover:text-[hsl(var(--reveal-strong))] transition-colors"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="font-display text-sm tracking-widest uppercase text-[hsl(var(--reveal)/0.8)] hover:text-[hsl(var(--reveal-strong))] transition-colors py-2 text-left"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-sm tracking-widest uppercase text-[hsl(var(--reveal)/0.8)] hover:text-[hsl(var(--reveal-strong))] transition-colors py-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-sm tracking-widest uppercase text-primary py-2"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
