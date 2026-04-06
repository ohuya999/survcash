import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Paystack webhook received:", JSON.stringify(body));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const event = body.event;
    const data = body.data;

    // Paystack charge.success event
    if (event === "charge.success") {
      const userId = data?.metadata?.user_id;
      const purpose = data?.metadata?.purpose;

      if (userId && purpose === "membership") {
        await supabase
          .from("profiles")
          .update({ is_paid: true })
          .eq("id", userId);
        console.log(`User ${userId} activated via Paystack webhook`);
      }

      // Handle withdrawal completion
      if (data?.metadata?.withdrawal_id) {
        await supabase
          .from("withdrawals")
          .update({ status: "completed" })
          .eq("id", data.metadata.withdrawal_id);
        console.log(`Withdrawal ${data.metadata.withdrawal_id} completed`);
      }
    }

    // Handle failed transfers (B2C withdrawals)
    if (event === "transfer.failed") {
      const withdrawalId = data?.metadata?.withdrawal_id;
      if (withdrawalId) {
        await supabase
          .from("withdrawals")
          .update({ status: "failed" })
          .eq("id", withdrawalId);
        console.log(`Withdrawal ${withdrawalId} failed`);
      }
    }

    if (event === "transfer.success") {
      const withdrawalId = data?.metadata?.withdrawal_id;
      if (withdrawalId) {
        await supabase
          .from("withdrawals")
          .update({ status: "completed" })
          .eq("id", withdrawalId);
        console.log(`Withdrawal ${withdrawalId} completed`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
