import React, { useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

const Apps = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [contactInfo, setContactInfo] = useState([]);
  const [msalInstance, setMsalInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

  const msalConfig = {
    auth: {
      clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f', // Your Application ID
      authority: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab', // Your Tenant ID
      redirectUri: 'https://unitopia-hub.vercel.app/', // Your Redirect URI
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  };

  const loginRequest = {
    scopes: ['User.Read.All'], // Permission to read all users' data
  };

  useEffect(() => {
    const instance = new PublicClientApplication(msalConfig);

    instance.handleRedirectPromise().catch((err) => {
      console.error("Redirect error:", err);
    });

    instance.initialize().then(() => {
      setMsalInstance(instance);
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        setIsAuthenticated(true);
        setUser(accounts[0]);
        fetchAllUsers(accounts[0], instance);
      }
    }).catch((err) => {
      setError(`Failed to initialize MSAL: ${err.message}`);
    });
  }, []);

  const handleSignIn = async () => {
    if (!msalInstance) {
      setError("MSAL not initialized");
      return;
    }

    if (isAuthInProgress) {
      setError("Login already in progress");
      return;
    }

    setIsAuthInProgress(true);
    setLoading(true);
    setError(null);

    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      if (loginResponse) {
        setIsAuthenticated(true);
        setUser(loginResponse.account);
        fetchAllUsers(loginResponse.account, msalInstance);
      }
    } catch (err) {
      setError(`Authentication failed: ${err.message}`);
    } finally {
      setIsAuthInProgress(false);
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (!msalInstance) return;
    msalInstance.logoutPopup();
    setIsAuthenticated(false);
    setUser(null);
    setContactInfo([]);
  };

  const fetchAllUsers = async (account, instance) => {
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/users?$select=displayName,mail,userPrincipalName,jobTitle,mobilePhone,officeLocation,department,businessPhones,physicalDeliveryOfficeName', {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      const data = await graphResponse.json();
      setContactInfo(data.value); // Array of users
    } catch (err) {
      setError(`Failed to fetch users: ${err.message}`);
    }
  };

  // Function to get the best available office value
  const getOfficeValue = (user) => {
    // First try officeLocation, then physicalDeliveryOfficeName, then default to N/A
    return user.officeLocation || user.physicalDeliveryOfficeName || 'N/A';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Staff Directory</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isAuthenticated ? (
        <button onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In with Microsoft'}
        </button>
      ) : (
        <>
          <button onClick={handleSignOut} style={{ marginBottom: '20px' }}>Sign Out</button>
          {contactInfo.length > 0 ? (
            <div>
              <h3>All Staff Contacts</h3>
              {contactInfo.map((user, index) => (
                <div key={index} style={{ padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                  <p><strong>Name:</strong> {user.displayName}</p>
                  <p><strong>Email:</strong> {user.mail || user.userPrincipalName}</p>
                  <p><strong>Job Title:</strong> {user.jobTitle || 'N/A'}</p>
                  <p><strong>Department:</strong> {user.department || 'N/A'}</p>
                  <p><strong>Mobile:</strong> {user.mobilePhone || 'N/A'}</p>
                  <p><strong>Business Phone:</strong> {user.businessPhones?.[0] || 'N/A'}</p>
                  <p><strong>Office Location:</strong> {user.officeLocation || 'N/A'}</p>
                  <p><strong>Office:</strong> {getOfficeValue(user)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading staff info...</p>
          )}
        </>
      )}
    </div>
  );
};

export default Apps;