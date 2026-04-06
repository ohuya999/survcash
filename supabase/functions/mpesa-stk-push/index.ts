import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("sk_test") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, amount, userId } = await req.json();

    if (!phone || !amount || !userId) {
      return new Response(JSON.stringify({ error: "Missing phone, amount, or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!PAYSTACK_SECRET_KEY) {
      // Simulate when credentials not configured
      console.log("Paystack credentials not configured — simulating STK push");
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("profiles").update({ is_paid: true }).eq("id", userId);

      return new Response(JSON.stringify({
        success: true,
        simulated: true,
        message: "Simulated STK push — account activated",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone: ensure it starts with 254
    let formattedPhone = String(phone).replace(/^0/, "254").replace(/^\+/, "");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = `254${formattedPhone}`;
    }

    // Paystack Mobile Money Charge
    const chargeRes = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // Paystack uses kobo/cents
        email: `${formattedPhone}@survcash.app`, // Paystack requires email
        currency: "KES",
        mobile_money: {
          phone: formattedPhone,
          provider: "mpesa",
        },
        metadata: {
          user_id: userId,
          purpose: "membership",
        },
      }),
    });

    const chargeData = await chargeRes.json();

    if (chargeData.status === true) {
      // If charge requires further action (e.g., STK push sent)
      return new Response(JSON.stringify({
        success: true,
        reference: chargeData.data?.reference,
        message: chargeData.data?.display_text || "STK Push sent! Enter your M-Pesa PIN.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: chargeData.message || "Payment initiation failed",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("STK Push error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
