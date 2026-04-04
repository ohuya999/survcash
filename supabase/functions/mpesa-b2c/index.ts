import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") || "";
const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET") || "";
const MPESA_B2C_SHORTCODE = Deno.env.get("MPESA_B2C_SHORTCODE") || "";
const MPESA_INITIATOR_NAME = Deno.env.get("MPESA_INITIATOR_NAME") || "";
const MPESA_SECURITY_CREDENTIAL = Deno.env.get("MPESA_SECURITY_CREDENTIAL") || "";
const MPESA_ENV = Deno.env.get("MPESA_ENV") || "sandbox";

const BASE_URL = MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(): Promise<string> {
  const credentials = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get M-Pesa access token");
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { phone, amount, withdrawalId, userId } = await req.json();

    if (!phone || !amount || !withdrawalId || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user eligibility
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance, referral_count")
      .eq("id", userId)
      .single();

    if (!profile || profile.balance < 1000 || profile.referral_count < 4) {
      return new Response(JSON.stringify({ error: "Not eligible for withdrawal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_B2C_SHORTCODE) {
      // Simulate B2C when credentials not configured
      console.log("M-Pesa B2C credentials not configured — simulating payout");
      await supabase.from("profiles").update({ balance: 0 }).eq("id", userId);
      await supabase.from("withdrawals").update({ status: "completed" }).eq("id", withdrawalId);

      return new Response(JSON.stringify({
        success: true,
        simulated: true,
        message: `Simulated B2C payout of KSh ${amount} to ${phone}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken();
    const callbackUrl = `${SUPABASE_URL}/functions/v1/mpesa-callback`;

    const b2cPayload = {
      InitiatorName: MPESA_INITIATOR_NAME,
      SecurityCredential: MPESA_SECURITY_CREDENTIAL,
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: MPESA_B2C_SHORTCODE,
      PartyB: phone,
      Remarks: "SURVCASH Withdrawal",
      QueueTimeOutURL: callbackUrl,
      ResultURL: callbackUrl,
      Occasion: withdrawalId,
    };

    const b2cRes = await fetch(`${BASE_URL}/mpesa/b2c/v3/paymentrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(b2cPayload),
    });

    const b2cData = await b2cRes.json();

    if (b2cData.ResponseCode === "0") {
      await supabase.from("profiles").update({ balance: 0 }).eq("id", userId);
      await supabase.from("withdrawals").update({ status: "processing" }).eq("id", withdrawalId);

      return new Response(JSON.stringify({
        success: true,
        ConversationID: b2cData.ConversationID,
        message: "B2C payment initiated",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      await supabase.from("withdrawals").update({ status: "failed" }).eq("id", withdrawalId);
      return new Response(JSON.stringify({
        success: false,
        error: b2cData.errorMessage || "B2C payment failed",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("B2C error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
