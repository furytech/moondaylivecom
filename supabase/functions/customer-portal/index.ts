import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { findPortalProfile, isPaidProfile } from "../_shared/portalProfile.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Verify active Luminary subscription status from Supabase. Only columns that exist: asking for a missing
    // column makes the whole query fail, which used to look like "no profile" and locked paying members out.
    const columns = "subscription_status, is_subscriber";
    const profile = await findPortalProfile(
      {
        byUserId: async (id) => {
          const { data, error } = await supabaseClient.from("user_profiles").select(columns).eq("user_id", id).maybeSingle();
          return { data, error: error?.message };
        },
        byEmail: async (mail) => {
          const { data, error } = await supabaseClient.from("user_profiles").select(columns).eq("email", mail).limit(1).maybeSingle();
          return { data, error: error?.message };
        },
      },
      user.id,
      user.email,
    );

    const isLuminary = isPaidProfile(profile);

    if (!isLuminary) {
      logStep("User does not have an active Luminary subscription", { profile });
      return new Response(
        JSON.stringify({ error: "Active Luminary subscription required to manage subscription" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find the Stripe customer by the member's email (profiles do not store a Stripe customer id).
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    if (!customerId) {
      throw new Error("No Stripe customer found for this user");
    }
    logStep("Found Stripe customer", { customerId });

    // Create billing portal session with return_url: 'https://moondaylive.com/blueprint'
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://moondaylive.com/blueprint",
    });
    logStep("Customer portal session created", { sessionId: portalSession.id });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
