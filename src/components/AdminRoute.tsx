import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "./ProtectedRoute";
import PageLayout from "./PageLayout";
import MoonLoader from "./MoonLoader";

/**
 * Route-level admin gate. Verifies the signed-in identity against the
 * server-side `has_role(uid, 'admin')` check — never client storage.
 */
const AdminGate = ({ children }: { children: React.ReactNode }) => {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["admin-route-check"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) return false;
      const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (error) return false;
      return !!data;
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

  if (!isAdmin) {
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

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AdminGate>{children}</AdminGate>
  </ProtectedRoute>
);

export default AdminRoute;
