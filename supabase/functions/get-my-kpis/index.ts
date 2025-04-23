import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Initializing get-my-kpis function");

const ADMIN_EMAILS = [
  'admin@scpng1.onmicrosoft.com',
  'admin@scpng.gov.pg'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Extract user email from the request body
    const { user_email } = await req.json(); 
    console.log("[get-my-kpis] Received data:", { user_email });

    if (!user_email) {
      console.error("[get-my-kpis] Missing user_email in request body");
      return new Response(
        JSON.stringify({ error: "Missing user_email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 2. Create Supabase Admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("[get-my-kpis] Missing Supabase environment variables.");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log("[get-my-kpis] Supabase Admin client created");

    // 3. Build the query based on user role
    let query = supabaseAdmin.from("unit_kpis").select("*");

    const isAdmin = ADMIN_EMAILS.includes(user_email.toLowerCase());

    if (isAdmin) {
      console.log(`[get-my-kpis] Admin user (${user_email}) detected. Fetching all KPIs.`);
      // Admins see all KPIs - no additional filter needed
    } else {
      console.log(`[get-my-kpis] Non-admin user (${user_email}). Fetching KPIs where assigned_to_email matches.`);
      query = query.eq("assigned_to_email", user_email);
    }

    // 4. Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("[get-my-kpis] Database error fetching KPIs:", error);
      return new Response(
        JSON.stringify({ error: "Database query error: " + error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`[get-my-kpis] Found ${data?.length ?? 0} KPIs for ${user_email} (Admin: ${isAdmin}).`);

    // 5. Return the filtered data
    return new Response(
      JSON.stringify(data || []), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err) {
    console.error("[get-my-kpis] Unhandled error:", err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return new Response(JSON.stringify({ error: "Invalid request body: Malformed JSON." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400
        });
    }
    return new Response(JSON.stringify({ error: "Internal Server Error: " + err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500
    });
  }
}); 