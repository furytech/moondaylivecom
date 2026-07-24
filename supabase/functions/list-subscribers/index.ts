import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Not authenticated");

    // Verify admin
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all profiles
    const { data: profiles, error: pErr } = await supabase
      .from("user_profiles")
      .select("user_id, email, is_subscriber, subscription_status, created_at")
      .order("created_at", { ascending: false });
    if (pErr) throw pErr;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

    const rows = await Promise.all(
      (profiles ?? []).map(async (p) => {
        let stripeActive = false;
        let currentPeriodStart: string | null = null;
        let currentPeriodEnd: string | null = null;
        let stripeCustomerId: string | null = null;

        if (stripe && p.email) {
          try {
            const customers = await stripe.customers.list({ email: p.email, limit: 1 });
            if (customers.data.length > 0) {
              stripeCustomerId = customers.data[0].id;
              const subs = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: "active",
                limit: 1,
              });
              if (subs.data.length > 0) {
                stripeActive = true;
                const s = subs.data[0] as any;
                if (s.current_period_start)
                  currentPeriodStart = new Date(s.current_period_start * 1000).toISOString();
                if (s.current_period_end)
                  currentPeriodEnd = new Date(s.current_period_end * 1000).toISOString();
              }
            }
          } catch (e) {
            console.error("Stripe lookup failed for", p.email, e);
          }
        }

        return {
          user_id: p.user_id,
          email: p.email,
          is_subscriber: p.is_subscriber,
          subscription_status: p.subscription_status,
          created_at: p.created_at,
          stripe_active: stripeActive,
          stripe_customer_id: stripeCustomerId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
        };
      })
    );

    return new Response(JSON.stringify({ subscribers: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
