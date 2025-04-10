// Microsoft Graph API configuration
const microsoftAuthConfig = {
  clientId: "648a96d7-e3f5-4e13-8084-ba0b74dbb56f",
  confirmed: true,
  apiEndpoint: "https://graph.microsoft.com/v1.0",
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
  // Default redirectUri that will be overridden based on environment
  redirectUri: typeof window !== 'undefined' ? window.location.origin : "https://unitopia-hub.vercel.app",
  // List of all approved redirect URIs that should be registered in Azure Portal
  approvedRedirectUris: [
    "https://unitopia-hub.vercel.app",
    "https://unitopia-rin2gjvob-zahs-projects-6dd0b7f4.vercel.app", // Current Vercel preview URL
    "http://localhost:3000",
    "http://localhost:5173" // Vite dev server
  ],
  authorityUrl: "https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab",
  test_success: true,
  last_confirmed: "2025-04-07T08:19:35.145Z"
};

// Log configuration information
if (typeof window !== 'undefined') {
  console.log('Microsoft Auth Config loaded');
  console.log('Using redirect URI:', microsoftAuthConfig.redirectUri);
  console.log('Current window origin:', window.location.origin);
  
  // Automatically use the current window's origin to support both production and development
  microsoftAuthConfig.redirectUri = window.location.origin;
  
  // Check if current origin is in the list of approved URIs
  const isApprovedUri = microsoftAuthConfig.approvedRedirectUris.includes(window.location.origin);
  
  if (!isApprovedUri) {
    console.error('⚠️ AUTHENTICATION ERROR RISK:');
    console.error(`Current origin "${window.location.origin}" is not in the list of approved redirect URIs.`);
    console.error('This URL must be registered in Azure Portal to avoid authentication errors.');
    console.error('Approved URIs:', microsoftAuthConfig.approvedRedirectUris);
    console.error('Add this URL to both:');
    console.error('1. The approvedRedirectUris array in this file');
    console.error('2. The Azure Portal app registration redirect URIs list');
  }
  
  // Show warning if running in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('⚠️ Running in development mode:');
    console.warn('- Using current origin as redirect URI:', window.location.origin);
    console.warn('- Make sure this URI is registered in Azure Portal');
    console.warn('- AND "https://unitopia-hub.vercel.app" is registered for production');
  }
}

export default microsoftAuthConfig; 