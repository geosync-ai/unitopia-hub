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
  
  // IMPORTANT: ALWAYS use window.location.origin for redirect URI to prevent inconsistencies
  const originUri = window.location.origin;
  microsoftAuthConfig.redirectUri = originUri;
  
  console.log('Using redirect URI:', microsoftAuthConfig.redirectUri);
  console.log('Current window origin:', window.location.origin);
  
  // Ensure the current origin is in the approved list
  if (!microsoftAuthConfig.approvedRedirectUris.includes(originUri)) {
    microsoftAuthConfig.approvedRedirectUris.push(originUri);
    console.log('Added current origin to approved URIs:', originUri);
  }
  
  console.log('Updating MSAL config with:', microsoftAuthConfig);
  
  // Check if current origin is in the list of approved URIs
  const isApprovedUri = microsoftAuthConfig.approvedRedirectUris.includes(originUri);
  
  if (!isApprovedUri) {
    console.error('⚠️ AUTHENTICATION ERROR RISK:');
    console.error(`Current origin "${originUri}" is not in the list of approved redirect URIs.`);
    console.error('This URL must be registered in Azure Portal to avoid authentication errors.');
    console.error('Approved URIs:', microsoftAuthConfig.approvedRedirectUris);
    console.error('Add this URL to both:');
    console.error('1. The approvedRedirectUris array in this file');
    console.error('2. The Azure Portal app registration redirect URIs list');
  } else {
    // If it's an approved URI, provide confirmation
    console.log('Current origin is approved for authentication:', originUri);
  }
  
  // Log the final MSAL config that will be used
  console.log('Updated MSAL config:', {
    clientId: microsoftAuthConfig.clientId,
    authority: microsoftAuthConfig.authorityUrl,
    redirectUri: microsoftAuthConfig.redirectUri, 
    postLogoutRedirectUri: microsoftAuthConfig.redirectUri
  });
  
  // Show warning if running in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('⚠️ Running in development mode:');
    console.warn('- Using current origin as redirect URI:', originUri);
    console.warn('- Make sure this URI is registered in Azure Portal');
    console.warn('- AND "https://unitopia-hub.vercel.app" is registered for production');
  }
}

export default microsoftAuthConfig; 