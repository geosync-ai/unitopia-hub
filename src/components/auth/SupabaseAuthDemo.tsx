import React, { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import SupabaseLoginButton from './SupabaseLoginButton';

interface UserInfo {
  id: string;
  email: string;
  name?: string;
  provider?: string;
}

const SupabaseAuthDemo: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    loginWithEmail,
    loginWithProvider, 
    logout,
    error 
  } = useSupabaseAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    setLoginLoading(true);
    
    try {
      await loginWithEmail(email, password);
      // Reset form fields on success
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Format user info for display
  const formatUserInfo = (): UserInfo | null => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email || 'No email',
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      provider: user.app_metadata?.provider
    };
  };

  // Display user information
  const renderUserInfo = () => {
    const userInfo = formatUserInfo();
    
    if (!userInfo) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h3 className="text-lg font-semibold mb-2">User Information</h3>
        <p><strong>ID:</strong> {userInfo.id}</p>
        <p><strong>Email:</strong> {userInfo.email}</p>
        {userInfo.name && <p><strong>Name:</strong> {userInfo.name}</p>}
        {userInfo.provider && <p><strong>Provider:</strong> {userInfo.provider}</p>}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Authentication Demo</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      ) : isAuthenticated ? (
        <div>
          <div className="text-center mb-6">
            <p className="text-green-600 font-semibold">You are logged in!</p>
            {renderUserInfo()}
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          {/* Email login form */}
          <form onSubmit={handleEmailLogin} className="mb-6">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              {loginLoading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </form>
          
          {/* Divider */}
          <div className="relative mt-6 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          {/* Provider login buttons */}
          <div className="space-y-3">
            <SupabaseLoginButton
              provider="google"
              text="Sign in with Google"
              className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
            />
            
            <SupabaseLoginButton
              provider="github"
              text="Sign in with GitHub"
              className="w-full bg-[#333] hover:bg-[#111] text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
            />
            
            {/* Add more provider buttons as needed */}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseAuthDemo; 