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

    // --- Find Supabase User ID by Email ---
    console.log(`Looking up user by email: ${user_email}`);
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single(); // Expect only one user per email

    if (userError || !userData) {
      console.error("Error finding user by email:", userError);
      const errorMessage = userData ? "User not found." : userError?.message || "Database query error";
      return new Response(
        JSON.stringify({ error: `Failed to find user: ${errorMessage}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 } // Use 404 if user not found
      );
    }
    
    const supabaseUserId = userData.id;
    console.log(`Found Supabase User ID: ${supabaseUserId}`);
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