// Simple script using fetch to update the Microsoft configuration
import fetch from 'node-fetch';

const SUPABASE_URL = "https://dmasclpgspatxncspcvt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM";

// Prepare the new configuration
const msConfig = {
  clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
  apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
  permissions: ['User.Read'],
  redirectUri: 'https://id-preview--3816f188-bb84-4c3d-963d-5a30c86f087c.lovable.app',
  authorityUrl: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
  test_success: true,
  last_tested: new Date().toISOString(),
  confirmed: true,
  last_confirmed: new Date().toISOString()
};

// First, check if the record exists
fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.microsoft_config`, {
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Current record:', data);
  
  // Now update the record
  return fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.microsoft_config`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      value: msConfig,
      updated_at: new Date().toISOString()
    })
  });
})
.then(response => {
  if (response.ok) {
    console.log('Update successful!');
    console.log('\nConfiguration to paste in browser console:');
    console.log(`localStorage.setItem('ms-api-config', '${JSON.stringify(msConfig)}')`);
    
    // Verify the update
    return fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.microsoft_config`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  } else {
    throw new Error(`Update failed with status: ${response.status}`);
  }
})
.then(response => response.json())
.then(data => {
  console.log('\nVerified current configuration in database:');
  console.log(data);
})
.catch(error => {
  console.error('Error:', error);
}); 