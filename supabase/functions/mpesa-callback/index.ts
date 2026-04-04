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
    console.log("M-Pesa Callback received:", JSON.stringify(body));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // STK Push callback
    if (body.Body?.stkCallback) {
      const callback = body.Body.stkCallback;
      const resultCode = callback.ResultCode;
      const checkoutRequestId = callback.CheckoutRequestID;

      if (resultCode === 0) {
        // Payment successful — extract metadata
        const items = callback.CallbackMetadata?.Item || [];
        const amount = items.find((i: any) => i.Name === "Amount")?.Value;
        const phone = items.find((i: any) => i.Name === "PhoneNumber")?.Value;
        const transactionId = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;

        console.log(`Payment confirmed: KSh ${amount} from ${phone}, Receipt: ${transactionId}`);

        // Find user by phone and activate
        if (phone) {
          const phoneStr = String(phone);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", phoneStr);

          if (profiles && profiles.length > 0) {
            await supabase
              .from("profiles")
              .update({ is_paid: true })
              .eq("id", profiles[0].id);
            console.log(`User ${profiles[0].id} activated`);
          }
        }
      } else {
        console.log(`Payment failed: ${callback.ResultDesc}`);
      }
    }

    // B2C callback
    if (body.Result) {
      const result = body.Result;
      const resultCode = result.ResultCode;
      const conversationId = result.ConversationID;

      if (resultCode === 0) {
        console.log(`B2C payment successful: ${conversationId}`);
        // Update withdrawal status
        await supabase
          .from("withdrawals")
          .update({ status: "completed" })
          .eq("id", conversationId);
      } else {
        console.log(`B2C payment failed: ${result.ResultDesc}`);
        await supabase
          .from("withdrawals")
          .update({ status: "failed" })
          .eq("id", conversationId);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
