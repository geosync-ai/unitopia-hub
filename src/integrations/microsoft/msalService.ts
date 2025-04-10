import { 
  PopupRequest, 
  RedirectRequest, 
  AuthenticationResult, 
  SilentRequest,
  AccountInfo,
  PublicClientApplication,
  IPublicClientApplication,
  InteractionRequiredAuthError
} from '@azure/msal-browser';
import { loginRequest } from './msalConfig';
import microsoftAuthConfig from '@/config/microsoft-auth';

// MSAL instance cache
let msalInstanceRef: IPublicClientApplication | null = null;

/**
 * Set the MSAL instance reference
 */
export const setMsalInstance = (instance: IPublicClientApplication) => {
  msalInstanceRef = instance;
};

/**
 * Get the MSAL instance, either from the reference or the window object (legacy support)
 */
export const getMsalInstance = (): IPublicClientApplication | null => {
  // First try to get the instance from our module-level reference
  if (msalInstanceRef) {
    return msalInstanceRef;
  }
  
  // Fallback to window for backward compatibility
  if (typeof window !== 'undefined' && (window as any).msalInstance) {
    return (window as any).msalInstance;
  }
  
  console.error('MSAL instance not found. Make sure MsalProvider is initialized.');
  return null;
};

/**
 * Get the current signed-in account
 */
export const getAccount = (msalInstance?: IPublicClientApplication): AccountInfo | null => {
  const instance = msalInstance || getMsalInstance();
  if (!instance) return null;
  
  // Get active account first
  const activeAccount = instance.getActiveAccount();
  if (activeAccount) return activeAccount;
  
  // Fallback to first account in cache
  const accounts = instance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

/**
 * Acquire a token silently, with interaction fallback if needed
 */
export const getAccessToken = async (
  scopes: string[] = microsoftAuthConfig.permissions || [],
  msalInstance?: IPublicClientApplication
): Promise<string | null> => {
  try {
    const instance = msalInstance || getMsalInstance();
    if (!instance) {
      throw new Error('MSAL instance not available. Ensure you are within the MsalProvider context.');
    }

    const account = getAccount(instance);
    if (!account) {
      console.log('No account found, redirecting to login...');
      await loginRedirect();
      return null;
    }

    const request = {
      scopes,
      account,
      forceRefresh: false
    };

    try {
      console.log('Attempting silent token acquisition...');
      const response = await instance.acquireTokenSilent(request);
      console.log('Token acquired silently.');
      return response.accessToken;
    } catch (error) {
      console.warn('Silent token acquisition failed:', error);
      
      if (error instanceof InteractionRequiredAuthError) {
        console.log('Interaction required, attempting redirect flow...');
        try {
          await instance.acquireTokenRedirect(request);
          // This will redirect, so we won't reach this point
          return null;
        } catch (redirectError) {
          console.error('Redirect authentication failed:', redirectError);
          throw redirectError;
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Token acquisition failed:', error);
    return null;
  }
};

/**
 * Initiate login via redirect flow
 */
export const loginRedirect = async (msalInstance?: IPublicClientApplication): Promise<void> => {
  const instance = msalInstance || getMsalInstance();
  if (!instance) {
    throw new Error('MSAL instance not available.');
  }
  
  try {
    await instance.loginRedirect({
      scopes: microsoftAuthConfig.permissions || [],
      redirectUri: typeof window !== 'undefined' ? window.location.origin : microsoftAuthConfig.redirectUri
    });
  } catch (error) {
    console.error('Login redirect failed:', error);
    throw error;
  }
};

/**
 * Log out the current user
 */
export const logout = async (msalInstance?: IPublicClientApplication): Promise<void> => {
  const instance = msalInstance || getMsalInstance();
  if (!instance) {
    console.warn('MSAL instance not available. Unable to logout.');
    return;
  }
  
  try {
    const account = getAccount(instance);
    await instance.logoutRedirect({
      account,
      postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : microsoftAuthConfig.redirectUri
    });
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

/**
 * Call Microsoft Graph API
 */
export const callMsGraphApi = async (
  endpoint: string,
  msalInstance?: IPublicClientApplication
): Promise<any> => {
  try {
    const accessToken = await getAccessToken(microsoftAuthConfig.permissions || [], msalInstance);
    if (!accessToken) {
      throw new Error('Unable to acquire access token for Graph API call.');
    }
    
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Graph API returned ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Microsoft Graph API:', error);
    throw error;
  }
};

/**
 * Get the user profile from Microsoft Graph API
 */
export const getUserProfile = async (
  msalInstance?: IPublicClientApplication,
  endpoint: string = microsoftAuthConfig.apiEndpoint
): Promise<any> => {
  try {
    const token = await getAccessToken(microsoftAuthConfig.permissions || [], msalInstance);
    if (!token) {
      throw new Error('Unable to acquire access token for user profile.');
    }
    
    const response = await fetch(`${endpoint}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Graph API returned ${response.status}: ${errorText}`);
    }
    
    const profile = await response.json();
    
    // Try to get profile photo if available
    try {
      const photoResponse = await fetch(`${endpoint}/me/photo/$value`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (photoResponse.ok) {
        const photoBlob = await photoResponse.blob();
        profile.photo = URL.createObjectURL(photoBlob);
      }
    } catch (photoError) {
      console.warn('Unable to retrieve profile photo:', photoError);
    }
    
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
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

export default {
  getMsalInstance,
  setMsalInstance,
  getAccount,
  getAccessToken,
  loginRedirect,
  logout,
  callMsGraphApi,
  getUserProfile
}; 