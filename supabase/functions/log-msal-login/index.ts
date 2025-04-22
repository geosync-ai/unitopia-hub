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
    // Only expect user_email from the client now
    const { user_email } = await req.json(); 
    console.log("Received data:", { user_email });

    if (!user_email) {
      console.error("Missing user_email in request body");
      return new Response(
        JSON.stringify({ error: "Missing user_email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
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

    // --- Find Supabase User ID by Email via RPC ---
    console.log(`Looking up user via RPC by email: ${user_email}`);
    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('get_user_id_by_email', { p_user_email: user_email }); // Pass email as argument
      // Note: .single() might not be needed/valid after rpc()

    if (rpcError) {
      console.error("Error calling RPC get_user_id_by_email:", rpcError);
      return new Response(
        JSON.stringify({ error: `RPC Error: ${rpcError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // The data returned by the RPC function *is* the user ID (or null)
    const supabaseUserId = rpcData; 

    if (!supabaseUserId) {
      console.error("User not found via RPC for email:", user_email);
      return new Response(
        JSON.stringify({ error: `User not found for email` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    console.log(`Found Supabase User ID via RPC: ${supabaseUserId}`);
    // --- End Find User ID ---

    // Insert data into the log table using the *found* Supabase User ID
    const { error: insertError } = await supabaseAdmin.from("user_login_log").insert({
      user_id: supabaseUserId, // Use the ID found in auth.users
      user_email: user_email,
    });

    if (insertError) {
      console.error("Error inserting into user_login_log:", insertError);
      return new Response(
        JSON.stringify({ error: "Database insert error: " + insertError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Successfully logged user login:", { user_id: supabaseUserId, user_email });
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