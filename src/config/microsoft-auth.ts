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
  // IMPORTANT: Use the exact URI registered in Azure
  redirectUri: "https://unitopia-hub.vercel.app/",
  // Only the single approved redirect URI
  approvedRedirectUris: [
    "https://unitopia-hub.vercel.app/"
  ],
  authorityUrl: "https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab",
  test_success: true,
  last_confirmed: "2025-04-07T08:19:35.145Z"
};

// Log configuration information
if (typeof window !== 'undefined') {
  console.log('Microsoft Auth Config loaded');
  
  // IMPORTANT: Always use the exact redirectUri configured in Azure
  // Do NOT dynamically set the redirectUri based on window.location.origin
  console.log('Using redirect URI:', microsoftAuthConfig.redirectUri);
  console.log('Current window origin:', window.location.origin);
  
  // Check if current origin matches the approved URI
  const isApprovedUri = microsoftAuthConfig.redirectUri === window.location.origin + '/';
  
  if (!isApprovedUri) {
    console.error('⚠️ AUTHENTICATION ERROR RISK:');
    console.error(`Current origin "${window.location.origin}" doesn't match the configured redirect URI: ${microsoftAuthConfig.redirectUri}`);
    console.error('This URL must be registered in Azure Portal to avoid authentication errors.');
    console.error('Approved URI:', microsoftAuthConfig.redirectUri);
  } else {
    // If it's an approved URI, provide confirmation
    console.log('Current origin matches the configured redirect URI');
  }
  
  // Log the final MSAL config that will be used
  console.log('Using MSAL config:', {
    clientId: microsoftAuthConfig.clientId,
    authority: microsoftAuthConfig.authorityUrl,
    redirectUri: microsoftAuthConfig.redirectUri, 
    postLogoutRedirectUri: microsoftAuthConfig.redirectUri
  });
}

export default microsoftAuthConfig; 