import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "./PageLayout";
import MoonLoader from "./MoonLoader";

/**
 * Route-level admin gate. Verifies the signed-in identity against the
 * server-side `has_role(uid, 'admin')` check — never client storage.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-route-check"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) return { signedIn: false, isAdmin: false };
      const { data: role, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      return { signedIn: true, isAdmin: !error && !!role };
    },
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-20 flex justify-center">
          <MoonLoader size="md" text="Checking access..." />
        </div>
      </PageLayout>
    );
  }

  if (!data?.signedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!data.isAdmin) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h1 className="font-display text-2xl text-foreground mb-4">Admin Access Required</h1>
          <p className="text-cream-muted">
            This area of Moonday Live is reserved for workspace administrators.
          </p>
        </div>
      </PageLayout>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;

