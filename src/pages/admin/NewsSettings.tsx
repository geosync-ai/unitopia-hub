import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase, logger } from '@/lib/supabaseClient'; // Import Supabase client
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'; // Import useSupabaseAuth hook
import { useMsal } from '@azure/msal-react'; // Import useMsal

const newsCategories = ['My Feed', 'SCPNG News', 'PNG Market News', 'Global Insights', 'All News'];
const GLOBAL_SETTINGS_ID = 1; // Fixed ID for the single global settings row

interface NewsSettingsProps {
  renderLayout?: boolean;
}

const NewsSettings: React.FC<NewsSettingsProps> = ({ renderLayout = true }) => {
  const { user, isLoading: isAuthLoading } = useSupabaseAuth();
  const { accounts, inProgress: msalInProgress } = useMsal(); // Get MSAL accounts and inProgress state

  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminStatusLoading, setIsAdminStatusLoading] = useState(true);

  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testMessageType, setTestMessageType] = useState<'success' | 'error' | '' >('');

  const initialPrompts: { [key: string]: string } = {};
  newsCategories.forEach(category => {
    if (category !== 'My Feed' && category !== 'SCPNG News') {
        initialPrompts[category] = '';
    }
  });
  const [prompts, setPrompts] = useState(initialPrompts);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);

  // State for chat
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const determineAdminAndFetchSettings = async () => {
      if (isAuthLoading || msalInProgress !== 'none') {
        logger.info('[NewsSettings] Waiting for auth/MSAL to complete...', { isAuthLoading, msalInProgress });
        setIsAdminStatusLoading(true); // Keep loading if auth is not ready
        setIsComponentLoading(true);
        return; 
      }
      setIsAdminStatusLoading(true);
      let currentIsAdmin = false;
      if (accounts.length > 0) {
        const account = accounts[0];
        if (account.name === 'Administrator') {
          currentIsAdmin = true;
          logger.info('[NewsSettings] Admin identified via MSAL account name: "Administrator".');
        } else {
          // Optional: Fallback to RPC or other checks if MSAL name isn't "Administrator"
          // For now, we rely on the MSAL name for UI admin status.
          logger.info('[NewsSettings] MSAL account name is not "Administrator".', { msalAccountName: account.name });
        }
      } else if (user) {
        // Fallback or primary check if MSAL accounts array is empty but Supabase user exists
        // This might happen in some edge cases or if MSAL isn't the only auth method.
        // You might still want to call your supabase.rpc('is_current_user_admin') here as a robust check.
        logger.warn('[NewsSettings] MSAL accounts array empty, but Supabase user exists. Consider RPC check for admin status here if needed.', { userId: user.id });
      } else {
        logger.info('[NewsSettings] No MSAL account or Supabase user for admin check.');
      }
      
      setIsAdmin(currentIsAdmin);
      setIsAdminStatusLoading(false);
      logger.info('[NewsSettings] Admin Check Completed (Client-side):', { isAdmin: currentIsAdmin, userEmail: user?.email, msalUser: accounts[0]?.username });

      // Fetch global settings regardless of admin status (for read-only view for non-admins)
      setIsComponentLoading(true);
      try {
        const { data, error } = await supabase
          .from('news_api_settings')
          .select('api_key, api_endpoint, prompts, last_updated_by')
          .eq('id', GLOBAL_SETTINGS_ID)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('[NewsSettings] Error fetching global settings:', error);
          setSaveStatus(`Error loading global settings: ${error.message}`);
        } else if (data) {
          setApiKey(data.api_key || '');
          setApiEndpoint(data.api_endpoint || '');
          const loadedPrompts = data.prompts || {};
          const updatedPrompts = { ...initialPrompts };
          newsCategories.forEach(category => {
            if (category !== 'My Feed' && category !== 'SCPNG News') {
                updatedPrompts[category] = loadedPrompts[category] || '';
            }
          });
          setPrompts(updatedPrompts);
          setLastUpdatedBy(data.last_updated_by);
          logger.info('[NewsSettings] Global settings loaded.', { settingsId: GLOBAL_SETTINGS_ID });
        } else {
          logger.warn('[NewsSettings] No global settings row (id=1). Admins should save to initialize.');
          setPrompts(initialPrompts);
        }
      } catch (err) {
        logger.error('[NewsSettings] Exception fetching global settings:', err);
        setSaveStatus('An unexpected error occurred while loading global settings.');
      }
      setIsComponentLoading(false);
    };

    determineAdminAndFetchSettings();
  }, [isAuthLoading, user, accounts, msalInProgress]); // Added accounts & msalInProgress to dependencies

  const handlePromptChange = (category: string, value: string) => {
    setPrompts(prevPrompts => ({ ...prevPrompts, [category]: value }));
  };

  const handleSaveSettings = async () => {
    // Admin check is primarily for UI enabling/disabling.
    // The RLS policy on Supabase is the true security gatekeeper.
    // Use the user object from the useAuth hook, ensuring it and its id property are available.
    setIsSaving(true);
    setSaveStatus('Saving global settings...');
    const settingsData = {
      id: GLOBAL_SETTINGS_ID,
      api_key: apiKey,
      api_endpoint: apiEndpoint,
      prompts: prompts,
      last_updated_by: user ? user.id : null,
      updated_at: new Date().toISOString(),
    };

    try {
      // Ensure we use the 'data' variable from the upsert response if needed, though it's not used here.
      const { error } = await supabase.from('news_api_settings').upsert(settingsData, { onConflict: 'id' }); 
      if (error) {
        // If RLS fails, the error from Supabase will be caught here.
        logger.error('[NewsSettings] Error saving global settings (Supabase):', error);
        setSaveStatus(`Error saving settings: ${error.message}. Check RLS and admin status in DB.`);
      } else {
        setSaveStatus('Global settings saved successfully!');
        setLastUpdatedBy(user ? user.id : null);
        logger.info('[NewsSettings] Global settings saved.', { adminMsalName: accounts[0]?.name, supabaseUserId: user ? user.id : 'anonymous' });
      }
    } catch (err) {
        logger.error('[NewsSettings] Exception saving global settings:', err);
        setSaveStatus('An unexpected error occurred while saving settings.');
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestMessage('');
    setTestMessageType('');

    if (!apiEndpoint || !apiKey) {
      setTestMessage('API Endpoint and API Key must be provided to test.');
      setTestMessageType('error');
      setIsTesting(false);
      return;
    }

    // Check if it looks like a Gemini endpoint
    if (apiEndpoint.includes('generativelanguage.googleapis.com')) {
      const fullGeminiEndpoint = `${apiEndpoint}?key=${apiKey}`;
      const testPrompt = "Test: Please respond with 'Hello World!'";
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: testPrompt,
              },
            ],
          },
        ],
      };

      try {
        logger.info('[NewsSettings] Testing Gemini API connection...', { endpoint: apiEndpoint.split('?')[0] });
        const response = await fetch(fullGeminiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();

        if (!response.ok) {
          const errorDetail = responseData?.error?.message || JSON.stringify(responseData);
          throw new Error(`API request failed with status ${response.status}: ${errorDetail}`);
        }

        if (responseData.candidates && responseData.candidates.length > 0 &&
            responseData.candidates[0].content && responseData.candidates[0].content.parts &&
            responseData.candidates[0].content.parts.length > 0 && responseData.candidates[0].content.parts[0].text) {
          const aiResponse = responseData.candidates[0].content.parts[0].text;
          setTestMessage(`Connection successful! AI says: "${aiResponse}"`);
          setTestMessageType('success');
          logger.info('[NewsSettings] Gemini API test successful.', { response: aiResponse });
        } else {
          throw new Error('Test response format not recognized or content missing.');
        }
      } catch (error: any) {
        logger.error('[NewsSettings] Gemini API test failed:', error);
        setTestMessage(`Connection failed: ${error.message}`);
        setTestMessageType('error');
      }
    } else {
      setTestMessage('Automated test for this endpoint type is not currently supported. Please test manually.');
      setTestMessageType('error');
      logger.warn('[NewsSettings] API test skipped: Endpoint does not appear to be a Gemini endpoint.', { endpoint: apiEndpoint });
    }

    setIsTesting(false);
  };

  // Combined loading state for UI
  const uiIsActuallyLoading = isAuthLoading || msalInProgress !== 'none' || isComponentLoading;
  // Admin privileges for editing UI elements
  // Ensure user and user.id are available for editing/saving actions
  const canEditSettings = !uiIsActuallyLoading;

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newUserMessage = { sender: 'user' as 'user', text: chatInput };
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setChatInput('');
    setIsSendingMessage(true);

    if (!apiEndpoint || !apiKey) {
      const aiErrorMessage = { sender: 'ai' as 'ai', text: 'API Endpoint and API Key must be configured to chat.' };
      setChatMessages(prevMessages => [...prevMessages, aiErrorMessage]);
      setIsSendingMessage(false);
      return;
    }

    // Assuming Gemini API for chat, similar to testConnection
    if (apiEndpoint.includes('generativelanguage.googleapis.com')) {
      const fullGeminiEndpoint = `${apiEndpoint}?key=${apiKey}`;
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: chatInput, // Send the current user input
              },
            ],
          },
        ],
        // Optional: Add previous messages for context, if API supports
        // history: chatMessages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{text: msg.text}]}))
      };

      try {
        logger.info('[NewsSettings Chat] Sending message to Gemini API...', { endpoint: apiEndpoint.split('?')[0] });
        const response = await fetch(fullGeminiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();

        if (!response.ok) {
          const errorDetail = responseData?.error?.message || JSON.stringify(responseData);
          throw new Error(`API request failed with status ${response.status}: ${errorDetail}`);
        }

        if (responseData.candidates && responseData.candidates.length > 0 &&
            responseData.candidates[0].content && responseData.candidates[0].content.parts &&
            responseData.candidates[0].content.parts.length > 0 && responseData.candidates[0].content.parts[0].text) {
          const aiResponseText = responseData.candidates[0].content.parts[0].text;
          const newAiMessage = { sender: 'ai' as 'ai', text: aiResponseText };
          setChatMessages(prevMessages => [...prevMessages, newAiMessage]);
          logger.info('[NewsSettings Chat] Gemini API response received.', { response: aiResponseText });
        } else {
          throw new Error('Chat response format not recognized or content missing.');
        }
      } catch (error: any) {
        logger.error('[NewsSettings Chat] Gemini API request failed:', error);
        const aiErrorMessage = { sender: 'ai' as 'ai', text: `Error: ${error.message}` };
        setChatMessages(prevMessages => [...prevMessages, aiErrorMessage]);
      }
    } else {
      const aiUnsupportedMessage = { sender: 'ai' as 'ai', text: 'Chat for this endpoint type is not currently supported.' };
      setChatMessages(prevMessages => [...prevMessages, aiUnsupportedMessage]);
      logger.warn('[NewsSettings Chat] Chat attempt on non-Gemini endpoint.', { endpoint: apiEndpoint });
    }

    setIsSendingMessage(false);
  };

  const content = (
    <>
      {uiIsActuallyLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading Global News Settings...</span>
        </div>
      ) : (
        <>
          {lastUpdatedBy && (
            <div className="mb-6 p-3 bg-gray-100 text-gray-600 border border-gray-300 rounded text-sm">
                <p>Last updated by user ID: {lastUpdatedBy}</p>
            </div>
          )}
          {!lastUpdatedBy && user === null && (
             <div className="mb-6 p-3 bg-gray-100 text-gray-600 border border-gray-300 rounded text-sm">
                <p>These settings appear to be uninitialized or were last saved by an anonymous user.</p>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Global News Admin Settings</h1>
            <p className="text-gray-500">Configure global news categories, AI scraping prompts, and API settings for AI-driven news tabs.</p>
          </div>
          
          {/* Flex container for two-column layout */}
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Left Column: Settings Forms */}
            <div className="flex-grow md:w-2/3 space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">AI API Configuration</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={canEditSettings ? "Enter global AI API Key" : "API Key (loading...)"}
                      disabled={!canEditSettings || isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiEndpoint">API Endpoint</Label>
                    <Input
                      id="apiEndpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder={canEditSettings ? "Enter global AI API Endpoint (optional)" : "API Endpoint (loading...)"}
                      disabled={!canEditSettings || isSaving}
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button 
                      onClick={handleTestConnection} 
                      disabled={isTesting || isSaving || uiIsActuallyLoading || (!apiKey && !apiEndpoint) }
                      variant="outline"
                    >
                      {isTesting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                    {testMessage && (
                      <p className={`text-sm ${testMessageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {testMessage}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">News Category Prompts (AI Driven)</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Define global prompts for AI-driven news categories. My Feed and SCPNG News are managed separately.
                </p>
                <div className="space-y-6">
                  {newsCategories.map(category => {
                      if (category === 'My Feed' || category === 'SCPNG News') {
                          return null;
                      }
                      return (
                          <div key={category}>
                              <Label htmlFor={`prompt-${category}`} className="text-lg font-medium">{category}</Label>
                              <Textarea
                              id={`prompt-${category}`}
                              value={prompts[category] || ''}
                              onChange={(e) => handlePromptChange(category, e.target.value)}
                              placeholder={canEditSettings ? `Enter AI prompt for ${category}...` : `Prompt for ${category} (loading...)`}
                              rows={3}
                              className="mt-1"
                              disabled={!canEditSettings || isSaving}
                              />
                          </div>
                      );
                  })}
                </div>
              </section>
              {/* Show save button if not loading, disabled state handles saving/testing */}
              {!uiIsActuallyLoading && (
                  <div className="flex items-center space-x-2">
                      <Button 
                          onClick={handleSaveSettings} 
                          disabled={isSaving || isTesting || uiIsActuallyLoading } 
                          className="mt-6"
                      >
                      {isSaving ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Settings...</>
                          ) : (
                          'Save Global Settings'
                      )}
                      </Button>
                      {saveStatus && !isSaving && <p className={`text-sm mt-6 ml-2 ${saveStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{saveStatus}</p>}
                  </div>
              )}
            </div> {/* End Left Column */}

            {/* Right Column: Chat Section */}
            {!uiIsActuallyLoading && (
              <div className="md:w-1/3 mt-10 md:mt-0">
                <section className="pt-0 md:pt-6">
                  <h2 className="text-xl font-semibold mb-4">AI Chat</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Chat directly with the configured AI. API Key and Endpoint must be set up above.
                  </p>
                  <div className="border border-gray-300 rounded-lg p-4 h-96 flex flex-col bg-white">
                    <div className="flex-grow overflow-y-auto mb-4 space-y-2">
                      {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div 
                            className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${ 
                              msg.sender === 'user' 
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isSendingMessage && chatMessages[chatMessages.length -1]?.sender === 'user' && (
                          <div className="flex justify-start">
                              <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-lg bg-gray-200 text-gray-800">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                          </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={canEditSettings ? "Type your message..." : "Chat disabled (loading settings...)"}
                        onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                        className="flex-grow mr-2"
                        disabled={!canEditSettings || isSendingMessage || !apiKey || !apiEndpoint}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={isSendingMessage || !chatInput.trim() || !apiKey || !apiEndpoint}
                      >
                        {isSendingMessage ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending</>
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </div>
                    {(!apiKey || !apiEndpoint) && canEditSettings && (
                      <p className="text-xs text-red-500 mt-2">
                        API Key and API Endpoint must be configured in the 'AI API Configuration' section to enable chat.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div> {/* End Flex container */}
        </>
      )}
    </>
  );

  if (renderLayout) {
    return <PageLayout>{content}</PageLayout>;
  }

  return content;
};

export default NewsSettings; 