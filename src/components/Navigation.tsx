import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import moonLogo from "@/assets/moon-logo-new.webp";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

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
          <Link to="/" className="flex items-center gap-3 hover-scale-subtle">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-background">
              <img
                src={moonLogo}
                alt="Moonday"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display text-lg tracking-wider text-foreground hidden sm:block">
              Moonday
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-x-5 xl:gap-x-6 lg:ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={(e) => handleNavClick(e, link)}
                className={`font-display text-[13px] xl:text-sm tracking-[0.18em] xl:tracking-widest uppercase whitespace-nowrap elegant-hover ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-foreground/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <button
                onClick={handleSignOut}
                className="font-display text-[13px] xl:text-sm tracking-[0.18em] xl:tracking-widest uppercase whitespace-nowrap text-foreground/70 elegant-hover"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-display text-[13px] xl:text-sm tracking-[0.18em] xl:tracking-widest uppercase whitespace-nowrap text-foreground/70 elegant-hover"
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
                      ? "text-primary"
                      : "text-foreground/70"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="font-display text-sm tracking-widest uppercase text-foreground/70 py-2 text-left"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-sm tracking-widest uppercase text-foreground/70 py-2"
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
