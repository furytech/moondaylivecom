import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkoutUrls } from "../_shared/checkoutUrls.ts";
import { bearerToken } from "../_shared/subscriptionAccess.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Server-side allowlist of valid Sovereign Tier price IDs.
  // Only these prices may ever be used to create a checkout session.
    const ALLOWED_PRICE_IDS = new Set<string>([
    "price_1ULN2GJowQfvwg0ZtYxb5Th5", // Monthly ($6.88)
    "price_1ULN4MJowQfvwg0ZjOGNtzgY", // Yearly ($58.88)
  ]);

  try {
    logStep("Function started");

    // Auth first: a missing or invalid token is a 401, never a 500.
    const token = bearerToken(req.headers.get("Authorization"));
    if (!token) {
      logStep("No auth header - returning 401");
      return new Response(JSON.stringify({ error: "Authentication required", code: "missing_token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user?.email) {
      logStep("Invalid session - returning 401", { error: authError?.message });
      return new Response(JSON.stringify({ error: "Authentication required", code: "invalid_token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId, returnOrigin } = await req.json();
    logStep("Received price ID", { priceId });

    if (typeof priceId !== "string" || !ALLOWED_PRICE_IDS.has(priceId)) {
      logStep("Rejected invalid price ID", { priceId });
      return new Response(JSON.stringify({ error: "Invalid price" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Redirect URLs come from an exact allowlist of our own hosts, never from arbitrary client input.
    const { success_url, cancel_url } = checkoutUrls(returnOrigin);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url,
      cancel_url,
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
