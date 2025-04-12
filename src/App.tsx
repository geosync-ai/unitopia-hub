import React, { useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

const Apps = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [msalInstance, setMsalInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

  const msalConfig = {
    auth: {
      clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
      authority: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
      redirectUri: 'https://unitopia-hub.vercel.app/',
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  };

  const loginRequest = {
    scopes: ['user.read'],
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
        fetchContactInfo(accounts[0], instance);
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
        fetchContactInfo(loginResponse.account, msalInstance);
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
    setContactInfo(null);
  };

  const fetchContactInfo = async (account, instance) => {
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      const data = await graphResponse.json();
      setContactInfo({
        name: data.displayName,
        email: data.mail || data.userPrincipalName,
        jobTitle: data.jobTitle,
        mobilePhone: data.mobilePhone,
        officeLocation: data.officeLocation,
      });
    } catch (err) {
      setError(`Failed to fetch contact info: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Microsoft Account Info</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isAuthenticated ? (
        <button onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In with Microsoft'}
        </button>
      ) : (
        <>
          <button onClick={handleSignOut}>Sign Out</button>
          {contactInfo && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Name:</strong> {contactInfo.name}</p>
              <p><strong>Email:</strong> {contactInfo.email}</p>
              <p><strong>Job Title:</strong> {contactInfo.jobTitle || 'N/A'}</p>
              <p><strong>Mobile:</strong> {contactInfo.mobilePhone || 'N/A'}</p>
              <p><strong>Office:</strong> {contactInfo.officeLocation || 'N/A'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Apps;
