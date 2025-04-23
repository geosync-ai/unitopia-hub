import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Function 'get-my-tasks' starting up...");

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use Service Role Key for server-side operations
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get user email from request body
    const { user_email } = await req.json();
    console.log(`Received request for tasks for email: ${user_email}`);

    if (!user_email) {
      console.error("User email not provided in the request body.");
      return new Response(JSON.stringify({ error: "User email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Query the unit_tasks table
    // Assuming 'assigned_to_email' is the correct column to filter by
    const { data, error } = await supabaseClient
      .from("unit_tasks")
      .select("*") // Select all columns or specify needed ones
      .eq("assigned_to_email", user_email); // Filter by user email

    if (error) {
      console.error("Supabase query error:", error);
      throw error; // Throw error to be caught by the outer catch block
    }

    console.log(`Successfully fetched ${data?.length ?? 0} tasks for ${user_email}`);

    // Return the data
    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, // Internal Server Error
    });
  }
});

// Note: Ensure you have a _shared/cors.ts file or replace corsHeaders with appropriate values.
// Example _shared/cors.ts:
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specific origins
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
*/ 