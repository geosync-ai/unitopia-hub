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
  
  // Update the redirect URI if provided
  if (config.redirectUri) {
    console.log('Using redirectUri:', config.redirectUri);
    updatedConfig.auth.redirectUri = config.redirectUri;
    updatedConfig.auth.postLogoutRedirectUri = config.redirectUri;
  }
  
  console.log('Updated MSAL config:', updatedConfig);
  return updatedConfig;
};

// Default login request configuration
export const loginRequest = {
  scopes: microsoftAuthConfig.permissions
};

// Default configuration
const msalConfig: Configuration = defaultConfig;

export default msalConfig; 