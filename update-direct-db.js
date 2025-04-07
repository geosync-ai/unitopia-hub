// Script to directly update Microsoft config in Supabase database
// Run this with: node update-direct-db.js

// Using fetch API (already built into Node.js)
const SUPABASE_URL = "https://dmasclpgspatxncspcvt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM";

// Your development server URL - change this to match your local environment
const LOCAL_ORIGIN = "http://localhost:8083"; // Update this to match your Vite server port

async function updateMicrosoftConfig() {
  try {
    console.log('Checking for existing microsoft_config records...');
    
    // Check if record exists
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.microsoft_config`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!checkResponse.ok) {
      throw new Error(`API check failed: ${checkResponse.status}`);
    }
    
    const existingRecords = await checkResponse.json();
    console.log('Current records:', existingRecords);
    
    // Create config object with the correct values
    const updatedConfig = {
      clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
      apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
      permissions: ['User.Read'],
      redirectUri: LOCAL_ORIGIN, // Use your local server URL
      authorityUrl: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
      test_success: true,
      last_tested: new Date().toISOString(),
      confirmed: true,
      last_confirmed: new Date().toISOString()
    };
    
    let result;
    
    if (existingRecords && existingRecords.length > 0) {
      // Delete all existing records first to ensure a clean state
      console.log('Deleting existing records...');
      
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.microsoft_config`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!deleteResponse.ok) {
        throw new Error(`API delete failed: ${deleteResponse.status}`);
      }
      
      console.log('Existing records deleted successfully.');
    }
    
    // Insert new record
    console.log('Inserting new record with updated redirectUri...');
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        key: 'microsoft_config',
        value: updatedConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    
    if (!insertResponse.ok) {
      throw new Error(`API insert failed: ${insertResponse.status}`);
    }
    
    console.log('Update successful!');
    
    // Verify the update
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.microsoft_config`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const verifiedRecords = await verifyResponse.json();
    console.log('Verified current configuration in database:', verifiedRecords);
    
    // Print localStorage command for manual update if needed
    console.log('\nConfiguration to paste in browser console:');
    console.log(`localStorage.setItem('ms-api-config', '${JSON.stringify(updatedConfig)}')`);
    
  } catch (error) {
    console.error('Error updating configuration:', error);
  }
}

updateMicrosoftConfig(); 