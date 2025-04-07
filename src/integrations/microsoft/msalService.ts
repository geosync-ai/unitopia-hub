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
    console.log('Starting Microsoft login with redirect...');
    console.log('Using redirect URI:', microsoftAuthConfig.redirectUri);
    await instance.loginRedirect(loginRequest);
    console.log('Login redirect initiated');
  } catch (error) {
    console.error('Error during Microsoft login:', error);
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