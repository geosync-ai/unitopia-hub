import React, { useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

const Apps = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // MSAL configuration
  const msalConfig = {
    auth: {
      clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f', // Your application (client) ID
      authority: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab', // Your directory (tenant) ID
      redirectUri: 'https://unitopia-hub.vercel.app/', // Your specific redirect URI
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    }
  };

  // MSAL instance
  const msalInstance = new PublicClientApplication(msalConfig);

  // Authentication parameters
  const loginRequest = {
    scopes: ['user.read', 'files.read']
  };

  // Handle sign in
  const handleSignIn = async () => {
    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      if (loginResponse) {
        setIsAuthenticated(true);
        setUser(loginResponse.account);
      }
    } catch (err) {
      setError(`Authentication failed: ${err.message}`);
      console.error(err);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    msalInstance.logout();
    setIsAuthenticated(false);
    setUser(null);
    setFolders([]);
  };

  // Get OneDrive folders
  const getOneDriveFolders = async () => {
    setLoading(true);
    try {
      // Get token
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: user
      });

      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching folders: ${response.statusText}`);
      }

      const data = await response.json();
      setFolders(data.value);
      setError(null);
    } catch (err) {
      setError(`Failed to get folders: ${err.message}`);
      console.error(err);
      
      // If silent token acquisition fails, fall back to interactive method
      if (err.name === "InteractionRequiredAuthError") {
        try {
          const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
          // Try fetching folders again with the new token
          const response = await fetch(
            'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
            {
              headers: {
                Authorization: `Bearer ${tokenResponse.accessToken}`
              }
            }
          );
          const data = await response.json();
          setFolders(data.value);
          setError(null);
        } catch (interactiveErr) {
          setError(`Failed to get folders: ${interactiveErr.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already signed in on page load
  useEffect(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      setIsAuthenticated(true);
      setUser(accounts[0]);
    }
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">OneDrive Folder Retrieval</h1>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      {!isAuthenticated ? (
        <button 
          onClick={handleSignIn}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign in with Microsoft
        </button>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Signed in as: {user?.username}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={getOneDriveFolders}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Get OneDrive Folders'}
              </button>
              <button 
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {folders.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Your OneDrive Folders</h2>
              <ul className="border rounded divide-y">
                {folders.map(folder => (
                  <li key={folder.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
                        <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
                      </svg>
                      <span>{folder.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            !loading && <p className="text-gray-600">No folders found or you haven't retrieved folders yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Apps;