import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("ERROR: STRIPE_SECRET_KEY not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If we have a webhook secret, verify the signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      logStep("Webhook signature verified");
    } else {
      // Fallback: parse the event directly (for initial setup before webhook secret is configured)
      event = JSON.parse(body) as Stripe.Event;
      logStep("Webhook received without signature verification");
    }

    logStep("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!customerEmail) {
        logStep("ERROR: No customer email in checkout session");
        return new Response(JSON.stringify({ error: "No customer email" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      logStep("Activating subscription for customer", { email: customerEmail });

      // Find the user profile by email and activate subscription
      const { data: profiles, error: fetchError } = await supabaseClient
        .from("user_profiles")
        .select("id, user_id")
        .eq("email", customerEmail)
        .limit(1);

      if (fetchError) {
        logStep("ERROR fetching profile", { error: fetchError.message });
        throw new Error(`Failed to fetch profile: ${fetchError.message}`);
      }

      if (profiles && profiles.length > 0) {
        const { error: updateError } = await supabaseClient
          .from("user_profiles")
          .update({
            is_subscriber: true,
            subscription_status: "sovereign",
          })
          .eq("user_id", profiles[0].user_id);

        if (updateError) {
          logStep("ERROR updating profile", { error: updateError.message });
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        logStep("Subscription activated successfully", { userId: profiles[0].user_id });
      } else {
        logStep("WARNING: No user profile found for email", { email: customerEmail });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Look up customer email from Stripe
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted || !("email" in customer) || !customer.email) {
        logStep("WARNING: Customer deleted or no email");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({
          is_subscriber: false,
          subscription_status: "free",
        })
        .eq("email", customer.email);

      if (updateError) {
        logStep("ERROR deactivating subscription", { error: updateError.message });
      } else {
        logStep("Subscription deactivated", { email: customer.email });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
