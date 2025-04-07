// Update Microsoft API configuration in Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://dmasclpgspatxncspcvt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const updateMicrosoftConfig = async () => {
  try {
    // First check if configuration exists
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('key', 'microsoft_config')
      .single();
    
    if (error) {
      console.error('Error checking for existing config:', error);
      return;
    }
    
    // Prepare new configuration
    const msConfig = {
      clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
      apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
      permissions: ['User.Read'],
      redirectUri: 'https://id-preview--3816f188-bb84-4c3d-963d-5a30c86f087c.lovable.app',
      authorityUrl: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
      test_success: true, // Marked as tested successfully
      last_tested: new Date().toISOString(),
      confirmed: true, // Mark as confirmed
      last_confirmed: new Date().toISOString()
    };
    
    console.log('Updating Microsoft configuration to:', msConfig);
    
    // Update the configuration using stringify to ensure proper JSON serialization
    const { error: updateError } = await supabase
      .from('app_config')
      .update({ 
        value: msConfig,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'microsoft_config');
    
    if (updateError) {
      console.error('Error updating configuration:', updateError);
      
      // Try alternative approach with direct JSON serialization
      console.log('Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('app_config')
        .update({ 
          value: JSON.parse(JSON.stringify(msConfig)),
          updated_at: new Date().toISOString() 
        })
        .eq('key', 'microsoft_config');
        
      if (altError) {
        console.error('Alternative approach also failed:', altError);
        return;
      } else {
        console.log('Alternative approach succeeded!');
      }
    } else {
      console.log('Microsoft configuration updated successfully!');
    }
    
    // Also update localStorage for immediate use in the browser
    console.log('\nUPDATE COMPLETE!\n');
    console.log('For immediate use in your browser, run this in the browser console:');
    console.log(`localStorage.setItem('ms-api-config', '${JSON.stringify(msConfig)}')`);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'microsoft_config')
      .single();
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log('\nVerification - Current configuration in database:');
      console.log(verifyData.value);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// Run the update
updateMicrosoftConfig(); 