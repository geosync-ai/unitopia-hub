import { 
  PopupRequest, 
  RedirectRequest, 
  AuthenticationResult, 
  SilentRequest,
  AccountInfo,
  PublicClientApplication,
  IPublicClientApplication
} from '@azure/msal-browser';
import { loginRequest } from './msalConfig';
import microsoftAuthConfig from '@/config/microsoft-auth';

// MSAL instance will be passed to these methods from the MsalProvider
let msalInstance: IPublicClientApplication | null = null;

// Set the MSAL instance
export const setMsalInstance = (instance: IPublicClientApplication) => {
  msalInstance = instance;
  (window as any).msalInstance = instance;
};

// Get the MSAL instance
export const getMsalInstance = () => msalInstance;

// Login with redirect
export const loginWithRedirect = async (instance: IPublicClientApplication, request: RedirectRequest): Promise<void> => {
  try {
    await instance.loginRedirect(request);
  } catch (error) {
    console.error('Error logging in with redirect:', error);
    throw error;
  }
};

// Login with popup
export const loginWithPopup = async (instance: IPublicClientApplication, request: any): Promise<void> => {
  try {
    await instance.loginPopup(request);
  } catch (error) {
    console.error('Error logging in with popup:', error);
    throw error;
  }
};

// Get user account
export const getAccount = (instance: IPublicClientApplication): AccountInfo | null => {
  const accounts = instance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

// Get access token
export const getAccessToken = async (instance: IPublicClientApplication): Promise<string> => {
  try {
    const account = getAccount(instance);
    if (!account) {
      throw new Error('No account found');
    }

    const tokenResponse = await instance.acquireTokenSilent({
      ...loginRequest,
      account
    });

    return tokenResponse.accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Get MS Graph API data
export const callMsGraphApi = async (instance: IPublicClientApplication, endpoint: string) => {
  try {
    const accessToken = await getAccessToken(instance);
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to call Microsoft Graph API');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Microsoft Graph API:', error);
    throw error;
  }
};

// Get user profile from MS Graph
export const getUserProfile = async (instance: IPublicClientApplication, apiEndpoint: string) => {
  try {
    const account = getAccount(instance);
    if (!account) {
      throw new Error('No account found');
    }

    const tokenResponse = await instance.acquireTokenSilent({
      ...loginRequest,
      account
    });

    const response = await fetch(`${apiEndpoint}`, {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Get user photo from MS Graph
export const getUserPhoto = async (instance: IPublicClientApplication, apiEndpoint: string) => {
  try {
    const account = getAccount(instance);
    if (!account) {
      throw new Error('No account found');
    }

    const tokenResponse = await instance.acquireTokenSilent({
      ...loginRequest,
      account
    });

    const response = await fetch(`${apiEndpoint}/photo/$value`, {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user photo');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error getting user photo:', error);
    throw error;
  }
};

// Login with Microsoft
export const loginWithMicrosoft = async (instance: IPublicClientApplication): Promise<void> => {
  try {
    console.log('[DEBUG - MSAL] Starting Microsoft login process...');
    
    // Make sure we have a clean state for this attempt
    localStorage.removeItem('msalLoginAttempts');
    
    // Ensure we're using the exact redirect URI from config
    const exactRedirectUri = microsoftAuthConfig.redirectUri;
    console.log('[DEBUG - MSAL] Using exact redirect URI:', exactRedirectUri);
    
    console.log('[DEBUG - MSAL] Authentication parameters:', {
      redirectUri: exactRedirectUri,
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      clientId: microsoftAuthConfig.clientId,
      authority: microsoftAuthConfig.authorityUrl,
      scopes: microsoftAuthConfig.permissions
    });
    
    // Check if the MSAL instance is properly initialized
    if (!instance) {
      console.error('[DEBUG - MSAL] Error: MSAL instance is null or undefined');
      throw new Error('MSAL instance not initialized');
    }
    
    // Check for existing accounts
    const accounts = instance.getAllAccounts();
    console.log('[DEBUG - MSAL] Existing accounts:', accounts.length ? accounts.map(a => ({ username: a.username, name: a.name })) : 'None');
    
    if (accounts.length > 0) {
      console.log('[DEBUG - MSAL] User is already logged in. Setting active account.');
      instance.setActiveAccount(accounts[0]);
      return;
    }
    
    // Create a customized login request with the exact redirect URI
    const customizedLoginRequest = {
      ...loginRequest,
      redirectUri: exactRedirectUri
    };
    
    // Add an attempt counter to localStorage to track redirect loop issues
    const attemptKey = 'msalLoginAttempts';
    const attempts = parseInt(localStorage.getItem(attemptKey) || '0', 10);
    localStorage.setItem(attemptKey, (attempts + 1).toString());
    console.log(`[DEBUG - MSAL] Login attempt #${attempts + 1}`);
    
    // If we detect multiple redirect attempts in a short time, we might be in a redirect loop
    if (attempts > 3) {
      console.error('[DEBUG - MSAL] Detected potential redirect loop. Stopping login process to prevent infinite redirects.');
      localStorage.removeItem(attemptKey);
      throw new Error('Potential redirect loop detected');
    }
    
    console.log('[DEBUG - MSAL] Attempting to initiate redirect login with customized request');
    await instance.loginRedirect(customizedLoginRequest);
    console.log('[DEBUG - MSAL] Login redirect initiated successfully');
  } catch (error) {
    console.error('[DEBUG - MSAL] Error during Microsoft login:', error);
    
    // Detailed error logging
    console.error('[DEBUG - MSAL] Error details:', {
      name: error.name,
      message: error.message,
      errorCode: error.errorCode,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Add more detailed error logging for specific issues
    if (error.errorCode === 'redirect_uri_mismatch' || 
        (error.message && error.message.includes('redirect'))) {
      console.error('[DEBUG - MSAL] This appears to be a redirect URI mismatch issue.');
      console.error('[DEBUG - MSAL] Configured redirect URI:', microsoftAuthConfig.redirectUri);
      console.error('[DEBUG - MSAL] Current origin:', typeof window !== 'undefined' ? window.location.origin : 'unknown');
      console.error('[DEBUG - MSAL] Make sure this exact URI is configured in the Azure portal for app ID:', microsoftAuthConfig.clientId);
      console.error('[DEBUG - MSAL] Try adding both URIs to your app registration in Azure:');
      console.error('[DEBUG - MSAL] 1. https://unitopia-hub.vercel.app');
      console.error('[DEBUG - MSAL] 2. ' + (typeof window !== 'undefined' ? window.location.origin : 'unknown'));
    }
    
    // Reset attempt counter on error
    localStorage.removeItem('msalLoginAttempts');
    
    throw error;
  }
};

// Logout from Microsoft
export const logoutFromMicrosoft = async (instance: IPublicClientApplication): Promise<void> => {
  try {
    await instance.logoutRedirect();
  } catch (error) {
    console.error('Error during Microsoft logout:', error);
    throw error;
  }
};

// Logout
export const logout = async (instance: IPublicClientApplication): Promise<void> => {
  try {
    await instance.logoutRedirect();
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Determine login method based on configuration
export const login = async (instance: IPublicClientApplication, scopes: string[] = loginRequest.scopes): Promise<void> => {
  const request = {
    ...loginRequest,
    scopes
  };
  
  await loginWithRedirect(instance, request as RedirectRequest);
}; 