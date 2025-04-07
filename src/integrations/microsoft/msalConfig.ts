import { Configuration, PopupRequest, RedirectRequest } from '@azure/msal-browser';

// This config will be dynamically updated from the values in useAuth
const msalConfig: Configuration = {
  auth: {
    clientId: '', // Will be populated dynamically
    authority: '', // Will be populated dynamically
    redirectUri: window.location.origin, // Default to current origin, will be updated dynamically if needed
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) {
          console.log(message);
        }
      },
      logLevel: 3, // Error
    }
  }
};

// Dynamic update of MSAL config from useAuth
export const updateMsalConfig = (msGraphConfig: any) => {
  if (msGraphConfig) {
    msalConfig.auth.clientId = msGraphConfig.clientId;
    msalConfig.auth.authority = msGraphConfig.authorityUrl;
    
    // Only update redirectUri if it's provided and not empty
    if (msGraphConfig.redirectUri && msGraphConfig.redirectUri.trim() !== '') {
      msalConfig.auth.redirectUri = msGraphConfig.redirectUri;
    } else {
      // Fallback to window.location.origin if not provided
      msalConfig.auth.redirectUri = window.location.origin;
    }
    
    console.log('Updated MSAL config:', msalConfig);
  } else {
    console.error('Cannot update MSAL config: msGraphConfig is null');
  }
  
  return msalConfig;
};

// Login request parameters
export const loginRequest = {
  scopes: ['User.Read']
};

// Set to true for redirect flow, false for popup
export const useRedirectFlow = true;

// Configure request objects for login
export const getLoginRequest = (scopes: string[]): RedirectRequest | PopupRequest => {
  return {
    scopes: scopes
  };
};

export default msalConfig; 