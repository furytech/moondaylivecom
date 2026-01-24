import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MoonLoader from "./MoonLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MoonLoader size="lg" text="Aligning the stars..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
