import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { processStripeEvent, type StripeEventLike } from "../_shared/stripeWebhookCore.ts";
import { sendCancellationEmail } from "../_shared/cancellationEmail.ts";

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

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not set");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    if (!sig) {
      logStep("ERROR: Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      logStep("Webhook signature verified");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logStep("ERROR: Signature verification failed", { error: msg });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    const result = await processStripeEvent(event as unknown as StripeEventLike, {
      claimEvent: async (eventId, eventType) => {
        const { error } = await supabaseClient
          .from("stripe_webhook_events")
          .insert({ event_id: eventId, event_type: eventType });
        if (!error) return "claimed";
        if (error.code === "23505") return "duplicate";
        // Table missing (migration not applied yet) or any other failure: process the event anyway.
        logStep("WARNING: dedupe insert failed", { code: error.code, error: error.message });
        return "unavailable";
      },
      releaseEvent: async (eventId) => {
        await supabaseClient.from("stripe_webhook_events").delete().eq("event_id", eventId);
      },
      getCustomerEmail: async (customerId) => {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted || !("email" in customer) || !customer.email) return null;
        return customer.email;
      },
      listSubscriptions: async (customerId) => {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
        return subs.data.map((s) => ({ id: s.id, status: s.status, created: s.created }));
      },
      findUserIdByEmail: async (email) => {
        const { data, error } = await supabaseClient
          .from("user_profiles")
          .select("user_id")
          .eq("email", email)
          .limit(1);
        if (error) {
          logStep("ERROR fetching profile", { error: error.message });
          throw new Error(`Failed to fetch profile: ${error.message}`);
        }
        return data && data.length > 0 ? data[0].user_id : null;
      },
      updateProfileByUserId: async (userId, update) => {
        const { error } = await supabaseClient.from("user_profiles").update(update).eq("user_id", userId);
        return { error: error?.message };
      },
      updateProfileByEmail: async (email, update) => {
        const { error } = await supabaseClient.from("user_profiles").update(update).eq("email", email);
        return { error: error?.message };
      },
      sendCancellationEmail: (to, endsAt) => sendCancellationEmail(to, endsAt, Deno.env.get("RESEND_API_KEY")),
      log: logStep,
    });

    return new Response(JSON.stringify(result.body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.status,
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
