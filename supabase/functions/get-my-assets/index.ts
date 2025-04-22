// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Initializing get-my-assets function");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for get-my-assets");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Extract user email from the request body
    const { user_email } = await req.json(); 
    console.log("[get-my-assets] Received data:", { user_email });

    if (!user_email) {
      console.error("[get-my-assets] Missing user_email in request body");
      return new Response(
        JSON.stringify({ error: "Missing user_email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 2. Create Supabase Admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("[get-my-assets] Missing Supabase environment variables.");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("[get-my-assets] Supabase Admin client created");

    // 3. Query the assets table, filtering by assigned_to_email
    console.log(`[get-my-assets] Fetching assets for email: ${user_email}`);
    const { data: assets, error: dbError } = await supabaseAdmin
      .from("assets") // Assuming your table name is 'assets'
      .select("*")    // Select all columns for now
      .eq("assigned_to_email", user_email); // Filter by the email

    if (dbError) {
      console.error("[get-my-assets] Database error fetching assets:", dbError);
      return new Response(
        JSON.stringify({ error: "Database query error: " + dbError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`[get-my-assets] Found ${assets?.length ?? 0} assets for ${user_email}`);

    // 4. Return the filtered assets
    return new Response(
      JSON.stringify(assets || []), // Return assets or empty array if null/undefined
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err) {
    console.error("[get-my-assets] Unhandled error:", err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return new Response(JSON.stringify({ error: "Invalid request body: Malformed JSON." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
    }
    return new Response(JSON.stringify({ error: "Internal Server Error: " + err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-my-assets' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
