import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Initializing log-msal-login function");

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, user_email } = await req.json();
    console.log("Received data:", { user_id, user_email });

    if (!user_id || !user_email) {
      console.error("Missing user_id or user_email in request body");
      return new Response(
        JSON.stringify({ error: "Missing user_id or user_email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Create Supabase Admin client
    // Ensure environment variables are set in Supabase project settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
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
    console.log("Supabase Admin client created");

    // Insert data into the log table using Admin client (bypasses RLS)
    const { error } = await supabaseAdmin.from("user_login_log").insert({
      user_id: user_id,       // Use the ID received from the client (MSAL localAccountId)
      user_email: user_email,
      // login_timestamp is handled by default value in the table schema
    });

    if (error) {
      console.error("Error inserting into user_login_log:", error);
      return new Response(
        JSON.stringify({ error: "Database error: " + error.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("Successfully logged user login:", { user_id, user_email });
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    // Check if the error is due to invalid JSON body
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