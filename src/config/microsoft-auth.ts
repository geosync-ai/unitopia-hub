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
  // IMPORTANT: Use a dynamic redirect URI based on the current environment
  // This prevents AADSTS50011 "redirect URI mismatch" errors
  redirectUri: typeof window !== 'undefined' ? window.location.origin : "https://unitopia-hub.vercel.app/",
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
    console.warn('This configuration will only work when deployed to https://unitopia-hub.vercel.app/');
    console.warn('For local development testing, you need to add http://localhost:[port]/ to your app registration in Azure Portal');
  }
}

export default microsoftAuthConfig; 