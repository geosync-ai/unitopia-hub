// Microsoft Graph API configuration
const microsoftAuthConfig = {
  clientId: "648a96d7-e3f5-4e13-8084-ba0b74dbb56f",
  confirmed: true,
  apiEndpoint: "https://graph.microsoft.com/v1.0/me",
  last_tested: "2025-04-07T08:19:35.145Z",
  permissions: [
    "User.Read",
    "People.Read",
    "Directory.Read.All",
    "Files.Read.All",
    "Files.ReadWrite.All",
    "Sites.Read.All",
    "Sites.ReadWrite.All"
  ],
  // CRITICAL: This must EXACTLY match what's in Azure portal (no trailing slash)
  redirectUri: "https://unitopia-hub.vercel.app",
  authorityUrl: "https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab",
  test_success: true,
  last_confirmed: "2025-04-07T08:19:35.145Z"
};

// Log configuration information
if (typeof window !== 'undefined') {
  console.log('Microsoft Auth Config loaded');
  console.log('Using redirect URI:', microsoftAuthConfig.redirectUri);
  console.log('Current window origin:', window.location.origin);
  
  // Show warning if running in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('⚠️ Running in development mode with production redirect URI.');
    console.warn('Authentication will fail unless your Azure app registration includes:');
    console.warn(`- Exactly "${window.location.origin}" as a redirect URI`);
    console.warn('- AND "https://unitopia-hub.vercel.app" as a redirect URI');
    console.warn('Please update your app registration in Azure Portal');
  }
}

export default microsoftAuthConfig; 