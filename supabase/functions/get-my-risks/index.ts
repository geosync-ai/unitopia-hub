import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Function 'get-my-risks' starting up...");

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use Service Role Key
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get user email from request body
    const { user_email } = await req.json();
    console.log(`Received request for risks for email: ${user_email}`);

    if (!user_email) {
      console.error("User email not provided.");
      return new Response(JSON.stringify({ error: "User email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Query the unit_risks table
    // Assuming 'assigned_to_email' or similar exists and is relevant
    const { data, error } = await supabaseClient
      .from("unit_risks") // <<< Changed table name
      .select("*") 
      .eq("assigned_to_email", user_email); // <<< Check if this column is correct for risks

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    console.log(`Successfully fetched ${data?.length ?? 0} risks for ${user_email}`);

    // Return the data
    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 