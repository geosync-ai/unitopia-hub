import { 
  PopupRequest, 
  RedirectRequest, 
  AuthenticationResult, 
  SilentRequest,
  AccountInfo
} from '@azure/msal-browser';
import { loginRequest, useRedirectFlow, getLoginRequest } from './msalConfig';

// MSAL instance will be passed to these methods from the MsalProvider
// These methods will handle the actual authentication calls

// Login with redirect
export const loginWithRedirect = async (instance: any, request?: RedirectRequest): Promise<void> => {
  try {
    const loginReq = request || loginRequest;
    console.log('Initiating redirect login with scopes:', loginReq.scopes);
    await instance.loginRedirect(loginReq);
  } catch (error) {
    console.error('Error during redirect login:', error);
    throw error;
  }
};

// Login with popup
export const loginWithPopup = async (instance: any, request?: PopupRequest): Promise<AuthenticationResult> => {
  try {
    const loginReq = request || loginRequest;
    console.log('Initiating popup login with scopes:', loginReq.scopes);
    return await instance.loginPopup(loginReq);
  } catch (error) {
    console.error('Error during popup login:', error);
    throw error;
  }
};

// Get user account
export const getAccount = (instance: any): AccountInfo | null => {
  const accounts = instance.getAllAccounts();
  if (accounts.length > 0) {
    return accounts[0];
  }
  return null;
};

// Get access token silently
export const getAccessToken = async (instance: any, scopes: string[]): Promise<string> => {
  const account = getAccount(instance);
  
  if (!account) {
    throw new Error('No active account! Sign in before getting an access token.');
  }
  
  const request: SilentRequest = {
    scopes,
    account
  };
  
  try {
    const response = await instance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    console.error('Silent token acquisition failed, falling back to interactive method:', error);
    // Fall back to interactive method
    const response = useRedirectFlow 
      ? await instance.acquireTokenRedirect(request)
      : await instance.acquireTokenPopup(request);
    return response.accessToken;
  }
};

// Get MS Graph API data
export const callMsGraphApi = async (accessToken: string, endpoint: string): Promise<any> => {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${accessToken}`);
  
  const options = {
    method: 'GET',
    headers
  };
  
  try {
    const response = await fetch(endpoint, options);
    return await response.json();
  } catch (error) {
    console.error('Error calling MS Graph API:', error);
    throw error;
  }
};

// Get user profile from MS Graph
export const getUserProfile = async (instance: any, endpoint: string): Promise<any> => {
  try {
    const accessToken = await getAccessToken(instance, ['User.Read']);
    return await callMsGraphApi(accessToken, endpoint);
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Logout
export const logout = async (instance: any): Promise<void> => {
  try {
    const logoutRequest = {
      account: getAccount(instance),
      postLogoutRedirectUri: window.location.origin
    };
    
    return useRedirectFlow
      ? await instance.logoutRedirect(logoutRequest)
      : await instance.logoutPopup(logoutRequest);
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Determine login method based on configuration
export const login = async (instance: any, scopes: string[] = loginRequest.scopes): Promise<AuthenticationResult | void> => {
  const request = getLoginRequest(scopes);
  return useRedirectFlow 
    ? await loginWithRedirect(instance, request as RedirectRequest)
    : await loginWithPopup(instance, request as PopupRequest);
}; 