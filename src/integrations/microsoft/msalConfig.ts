import { Configuration, PopupRequest, RedirectRequest } from '@azure/msal-browser';
import microsoftAuthConfig from '@/config/microsoft-auth';

// Default configuration for MSAL
const defaultConfig = {
  auth: {
    clientId: microsoftAuthConfig.clientId,
    authority: microsoftAuthConfig.authorityUrl,
    redirectUri: microsoftAuthConfig.redirectUri,
    postLogoutRedirectUri: microsoftAuthConfig.redirectUri,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        
        // Filter out repetitive token-related logs
        if (message.includes('CacheManager:getIdToken') || 
            message.includes('CacheManager:getAccessToken')) {
          return;
        }
        
        switch (level) {
          case 0:
            console.error(message);
            return;
          case 1:
            console.warn(message);
            return;
          case 2:
            console.info(message);
            return;
          case 3:
            console.debug(message);
            return;
          default:
            console.log(message);
            return;
        }
      }
    }
  }
};

// Function to update the configuration with custom values
export const updateMsalConfig = (config: any): Configuration => {
  console.log('Updating MSAL config with:', config);
  
  // Create a copy of the default config
  const updatedConfig = { ...defaultConfig };
  
  // Update the client ID if provided
  if (config.clientId) {
    updatedConfig.auth.clientId = config.clientId;
  }
  
  // Update the authority if provided
  if (config.authorityUrl) {
    updatedConfig.auth.authority = config.authorityUrl;
  }
  
  // Update the redirect URI if provided - ensure exact match with Azure configuration
  if (config.redirectUri) {
    console.log('Using redirectUri:', config.redirectUri);
    updatedConfig.auth.redirectUri = config.redirectUri;
    updatedConfig.auth.postLogoutRedirectUri = config.redirectUri;
  }
  
  // Print the final configuration for debugging
  console.log('Updated MSAL config:', {
    clientId: updatedConfig.auth.clientId,
    authority: updatedConfig.auth.authority,
    redirectUri: updatedConfig.auth.redirectUri,
    postLogoutRedirectUri: updatedConfig.auth.postLogoutRedirectUri,
  });
  
  return updatedConfig;
};

// Default login request configuration - IMPORTANT: DO NOT include redirectUri here
// The redirect URI will be added at login time from the config to ensure consistency
export const loginRequest = {
  scopes: microsoftAuthConfig.permissions
};

// Default configuration
const msalConfig: Configuration = defaultConfig;

export default msalConfig; 