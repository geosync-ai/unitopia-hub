import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    MessageSquare, Bot, Lightbulb, FileText, Search, Send, Upload, Loader2, Settings, Maximize, Minimize, 
    ClipboardCopy, Check, Trash2, Link as LinkIcon 
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KnowledgeUploadModal from '@/components/ai/KnowledgeUploadModal';
import { useUIRoles } from '@/hooks/useUIRoles';
import { cn } from '@/lib/utils';
import { supabase, logger } from '@/lib/supabaseClient';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useMsal } from '@azure/msal-react';
import { useMicrosoftGraph, type GraphContextType } from '@/hooks/useMicrosoftGraph';
import { v4 as uuidv4 } from 'uuid';
import scpngLawyerAiPromptText from '@/prompts/scpngLawyerAiPrompt.txt';
import scpngDocAnalystPromptText from '@/prompts/scpngDocAnalystPrompt.txt';
import { ExternalLink } from 'lucide-react';

const GLOBAL_SETTINGS_ID = 1;

const KB_SHAREPOINT_SITEPATH = "/sites/scpngintranet";
const KB_SHAREPOINT_LIBRARY_NAME = "SCPNG Docuements";
const KB_SHAREPOINT_TARGET_FOLDER = "KnowledgeBaseDocuments";

// Define AI Modes
const aiModes = [
  {
    id: 'general',
    title: 'General Purpose AI',
    prompt: "You are a helpful, neutral general-purpose assistant capable of summarizing, explaining, and analyzing a wide range of topics and documents for a non-expert audience. Avoid legal interpretations or policy enforcement advice."
  },
  {
    id: 'doc_analyst',
    title: 'SCPNG Document Analyst',
    prompt: scpngDocAnalystPromptText
  },
  {
    id: 'lawyer_ai',
    title: 'SCPNG Lawyer AI',
    prompt: scpngLawyerAiPromptText
  }
];

// Define the new ChatMessage type
interface ChatMessage {
  id: string; // For unique key prop and managing individual animations
  sender: 'user' | 'ai';
  text: string; // For user messages, this is the full text. For AI, this is the currently displayed animated text.
  fullText?: string; // For AI messages, the complete response from the API.
  isTyping?: boolean; // True if this AI message is currently being typed out.
  timestamp: Date; // To help order messages if needed, though id should suffice for keys
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string; // To differentiate between actual file uploads and simple links
  created_at: string;
}

const AIHub = () => {
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      sender: 'ai',
      text: "Hello! I'm your SCPNG AI Assistant. How can I help you today?",
      isTyping: false,
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<string | null>(null);
  const [currentAiModeId, setCurrentAiModeId] = useState<string>(aiModes[0].id); // State for current AI mode
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null); // For copy feedback

  const [uploadedSharePointFiles, setUploadedSharePointFiles] = useState<UploadedFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [loadFilesError, setLoadFilesError] = useState<string | null>(null);

  const { isSystemAdmin } = useUIRoles();
  const { user, isLoading: isAuthLoading } = useSupabaseAuth();
  const { accounts, inProgress: msalInProgress } = useMsal();
  const graphContext = useMicrosoftGraph() as GraphContextType;

  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testMessageType, setTestMessageType] = useState<'success' | 'error' | ''>('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);

  const [isConfigLoading, setIsConfigLoading] = useState(true);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai' && lastMessage.isTyping && lastMessage.fullText) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      const typeNextChar = (charIndex: number) => {
        if (charIndex < lastMessage.fullText!.length) {
          setChatMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === lastMessage.id
                ? { ...msg, text: lastMessage.fullText!.substring(0, charIndex + 1) }
                : msg
            )
          );
          scrollToBottom(); // Scroll as text types
          typingTimeoutRef.current = setTimeout(() => typeNextChar(charIndex + 1), 25);
        } else {
          setChatMessages(prevMessages =>
            prevMessages.map(msg => (msg.id === lastMessage.id ? { ...msg, isTyping: false } : msg))
          );
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          scrollToBottom(); // Ensure scrolled to end after typing finishes
        }
      };
      const currentDisplayTextLength = lastMessage.text?.length || 0;
      if (currentDisplayTextLength < lastMessage.fullText.length) {
        typeNextChar(currentDisplayTextLength);
      } else {
        setChatMessages(prevMessages =>
          prevMessages.map(msg => (msg.id === lastMessage.id ? { ...msg, isTyping: false } : msg))
        );
      }
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]); // Rerun when a new AI message starts typing or chatMessages array ref changes

   useEffect(() => {
    // More robust scroll to bottom, especially after images or content that might change height
    const timer = setTimeout(() => {
        scrollToBottom();
    }, 50); // A small delay can help if content is still rendering/reflowing
    return () => clearTimeout(timer);
  }, [chatMessages]);

  useEffect(() => {
    const fetchAiSettings = async () => {
      if (isAuthLoading || msalInProgress !== 'none') {
        logger.info('[AIHub] Waiting for auth/MSAL to complete before fetching AI settings.');
        setIsConfigLoading(true);
        return;
      }
      setIsConfigLoading(true);
      try {
        const { data, error } = await supabase
          .from('news_api_settings')
          .select('api_key, api_endpoint, last_updated_by')
          .eq('id', GLOBAL_SETTINGS_ID)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('[AIHub] Error fetching AI settings:', error);
          setSaveStatus(`Error loading AI settings: ${error.message}`);
          setChatMessages(prev => [...prev, { 
            id: uuidv4(), 
            sender: 'ai', 
            text: "Error loading AI Assistant configuration.", 
            isTyping: false, 
            timestamp: new Date() 
          }]);
        } else if (data) {
          setApiKey(data.api_key || '');
          setApiEndpoint(data.api_endpoint || '');
          setLastUpdatedBy(data.last_updated_by);
          logger.info('[AIHub] AI settings loaded successfully.');
        } else {
          logger.warn('[AIHub] No AI settings found (id=1). Admins should save to initialize.');
          setChatMessages(prev => [...prev, { 
            id: uuidv4(), 
            sender: 'ai', 
            text: "AI Assistant not fully configured. Please set API Key and Endpoint in AI Configuration.", 
            isTyping: false, 
            timestamp: new Date() 
          }]);
        }
      } catch (err:any) {
        logger.error('[AIHub] Exception fetching AI settings:', err);
        setSaveStatus('An unexpected error occurred while loading AI settings.');
        setChatMessages(prev => [...prev, { 
          id: uuidv4(), 
          sender: 'ai', 
          text: "Error loading AI Assistant configuration.", 
          isTyping: false, 
          timestamp: new Date() 
        }]);
      }
      setIsConfigLoading(false);
    };
    fetchAiSettings();
  }, [isAuthLoading, msalInProgress]);

  const handleSaveAiSettings = async () => {
    setIsSaving(true);
    setSaveStatus('Saving AI settings...');
    const settingsData = {
      id: GLOBAL_SETTINGS_ID,
      api_key: apiKey,
      api_endpoint: apiEndpoint,
      last_updated_by: user ? user.id : null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('news_api_settings').upsert(settingsData, { onConflict: 'id' });
      if (error) {
        logger.error('[AIHub] Error saving AI settings (Supabase):', error);
        setSaveStatus(`Error saving settings: ${error.message}.`);
      } else {
        setSaveStatus('AI settings saved successfully!');
        setLastUpdatedBy(user ? user.id : null);
        logger.info('[AIHub] AI settings saved.', { adminMsalName: accounts[0]?.name, supabaseUserId: user?.id });
      }
    } catch (err) {
      logger.error('[AIHub] Exception saving AI settings:', err);
      setSaveStatus('An unexpected error occurred while saving AI settings.');
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus(''), 5000);
  };

  const handleTestAiConnection = async () => {
    setIsTesting(true);
    setTestMessage('');
    setTestMessageType('');

    if (!apiEndpoint || !apiKey) {
      setTestMessage('API Endpoint and API Key must be provided to test.');
      setTestMessageType('error');
      setIsTesting(false);
      return;
    }

    if (apiEndpoint.includes('generativelanguage.googleapis.com')) {
      const fullGeminiEndpoint = `${apiEndpoint}?key=${apiKey}`;
      const testPrompt = "Test: Please respond with 'Hello World!'";
      const requestBody = { contents: [{ parts: [{ text: testPrompt }] }] };

      try {
        logger.info('[AIHub] Testing Gemini API connection...', { endpoint: apiEndpoint.split('?')[0] });
        const response = await fetch(fullGeminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const responseData = await response.json();
        if (!response.ok) {
          const errorDetail = responseData?.error?.message || JSON.stringify(responseData);
          throw new Error(`API request failed with status ${response.status}: ${errorDetail}`);
        }
        if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
          let aiResponse = responseData.candidates[0].content.parts[0].text;
          // Clean asterisks more carefully, in order
          // 1. Handle list items that are also bolded, e.g. * **Bold Item:** Suffix
          aiResponse = aiResponse.replace(/^(\s*)\*\s+\*\*(.*?)\*\*(.*)/gm, '$1  $2$3');
          // 2. Handle any remaining general bolding, e.g. **Bold Heading**
          aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '$1');
          // 3. Handle general list items, e.g. * Item text
          aiResponse = aiResponse.replace(/^(\s*)\*\s+(.*)/gm, '$1  $2');

          // 4. Indent lines following a line ending with a colon (if they are not blank)
          aiResponse = aiResponse.replace(/^(.*\S.*:)\n((?:^[ \t]*\S.*(?:$))+)/gm, (match, introLine, contentLines) => {
              const lines = contentLines.split('\n');
              let resultLines = [];
              let stopAutoIndentingThisAndFutureLines = false; // Renamed for clarity

              for (let i = 0; i < lines.length; i++) {
                  const line = lines[i];
                  const trimmedLine = line.trim();

                  if (stopAutoIndentingThisAndFutureLines) {
                      resultLines.push(line); // Preserve original line
                      continue;
                  }

                  // Check if this line signals the end of the auto-indent block
                  if (i > 0) {
                      const prevLineTrimmed = lines[i-1].trim();
                      // Corrected regex for "Term: "
                      const termDefRegex = /^[A-Z].*:\\s+/; 
                      const prevWasTermDef = termDefRegex.test(prevLineTrimmed);
                      const currentIsNotTermDef = !termDefRegex.test(trimmedLine);
                      const currentStartsWithCaps = /^[A-Z]/.test(trimmedLine);

                      // If prev was a "Term:", and current is not a "Term:" but a new capitalized sentence,
                      // then this current line, and subsequent lines, should not be auto-indented.
                      if (prevWasTermDef && currentIsNotTermDef && currentStartsWithCaps) {
                          stopAutoIndentingThisAndFutureLines = true;
                          resultLines.push(line); // Preserve this line as is
                          continue; 
                      }
                  }

                  // If we are still auto-indenting:
                  // Add "  " prefix only if the line isn't already indented by the AI.
                  if (/^\\s/.test(line)) { // If line already starts with some whitespace
                      resultLines.push(line); // Use AI's existing indent
                  } else {
                      resultLines.push('  ' + line); // Add indent because AI didn't provide any
                  }
              }
              return introLine + '\n' + resultLines.join('\n');
          });

          setTestMessage(`Connection successful! AI says: "${aiResponse}"`);
          setTestMessageType('success');
          logger.info('[AIHub] Gemini API test successful.', { response: aiResponse });
        } else {
          throw new Error('Test response format not recognized or content missing.');
        }
      } catch (error: any) {
        logger.error('[AIHub] Gemini API test failed:', error);
        setTestMessage(`Connection failed: ${error.message}`);
        setTestMessageType('error');
      }
    } else {
      setTestMessage('Automated test for this endpoint type is not currently supported.');
      setTestMessageType('error');
      logger.warn('[AIHub] API test skipped: Endpoint does not appear to be a Gemini endpoint.', { endpoint: apiEndpoint });
    }
    setIsTesting(false);
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const messageToSend = query.trim(); // Use query directly, chatInput can be removed if not used elsewhere
    if (!messageToSend) return;

    const newUserMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      text: messageToSend,
      timestamp: new Date(),
    };
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setQuery('');
    setIsSendingChatMessage(true);

    if (!apiEndpoint || !apiKey) {
      const aiErrorMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'ai',
        text: 'AI is not configured. Please set API Key and Endpoint.',
        isTyping: false,
        timestamp: new Date(),
      };
      setChatMessages(prevMessages => [...prevMessages, aiErrorMessage]);
      setIsSendingChatMessage(false);
      return;
    }

    const currentMode = aiModes.find(mode => mode.id === currentAiModeId);
    const systemInstruction = currentMode ? { parts: [{ text: currentMode.prompt }] } : undefined;

    if (apiEndpoint.includes('generativelanguage.googleapis.com')) {
      const fullGeminiEndpoint = `${apiEndpoint}?key=${apiKey}`;
      const requestBody: any = {
        contents: [{ role: 'user', parts: [{ text: messageToSend }] }],
      };
      if (systemInstruction) {
        requestBody.system_instruction = systemInstruction;
      }

      try {
        logger.info('[AIHub Chat] Sending message to Gemini API...', { endpoint: apiEndpoint.split('?')[0], mode: currentMode?.title });
        const response = await fetch(fullGeminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody) 
        });
        const responseData = await response.json();

        if (!response.ok) {
          const errorDetail = responseData?.error?.message || JSON.stringify(responseData);
          throw new Error(`API request failed: ${errorDetail}`);
        }

        if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
          let aiResponseText = responseData.candidates[0].content.parts[0].text;
          // Clean asterisks more carefully, in order
          // 1. Handle list items that are also bolded, e.g. * **Bold Item:** Suffix
          aiResponseText = aiResponseText.replace(/^(\s*)\*\s+\*\*(.*?)\*\*(.*)/gm, '$1  $2$3');
          // 2. Handle any remaining general bolding, e.g. **Bold Heading**
          aiResponseText = aiResponseText.replace(/\*\*(.*?)\*\*/g, '$1');
          // 3. Handle general list items, e.g. * Item text
          aiResponseText = aiResponseText.replace(/^(\s*)\*\s+(.*)/gm, '$1  $2');
          
          // 4. Indent lines following a line ending with a colon (if they are not blank)
          aiResponseText = aiResponseText.replace(/^(.*\S.*:)\n((?:^[ \t]*\S.*(?:$))+)/gm, (match, introLine, contentLines) => {
              const lines = contentLines.split('\n');
              let resultLines = [];
              let stopAutoIndentingThisAndFutureLines = false; // Renamed for clarity

              for (let i = 0; i < lines.length; i++) {
                  const line = lines[i];
                  const trimmedLine = line.trim();

                  if (stopAutoIndentingThisAndFutureLines) {
                      resultLines.push(line); // Preserve original line
                      continue;
                  }

                  // Check if this line signals the end of the auto-indent block
                  if (i > 0) {
                      const prevLineTrimmed = lines[i-1].trim();
                      // Corrected regex for "Term: "
                      const termDefRegex = /^[A-Z].*:\\s+/; 
                      const prevWasTermDef = termDefRegex.test(prevLineTrimmed);
                      const currentIsNotTermDef = !termDefRegex.test(trimmedLine);
                      const currentStartsWithCaps = /^[A-Z]/.test(trimmedLine);

                      // If prev was a "Term:", and current is not a "Term:" but a new capitalized sentence,
                      // then this current line, and subsequent lines, should not be auto-indented.
                      if (prevWasTermDef && currentIsNotTermDef && currentStartsWithCaps) {
                          stopAutoIndentingThisAndFutureLines = true;
                          resultLines.push(line); // Preserve this line as is
                          continue; 
                      }
                  }

                  // If we are still auto-indenting:
                  // Add "  " prefix only if the line isn't already indented by the AI.
                  if (/^\\s/.test(line)) { // If line already starts with some whitespace
                      resultLines.push(line); // Use AI's existing indent
                  } else {
                      resultLines.push('  ' + line); // Add indent because AI didn't provide any
                  }
              }
              return introLine + '\n' + resultLines.join('\n');
          });
          
          const newAiMessage: ChatMessage = {
            id: uuidv4(),
            sender: 'ai',
            text: '', 
            fullText: aiResponseText, // Use the cleaned text
            isTyping: true, 
            timestamp: new Date(),
          };
          setChatMessages(prevMessages => [...prevMessages, newAiMessage]);
        } else {
          throw new Error('Chat response format not recognized or content missing.');
        }
      } catch (error: any) {
        logger.error('[AIHub Chat] Gemini API request failed:', error);
        const aiErrorMessage: ChatMessage = {
          id: uuidv4(),
          sender: 'ai',
          text: `Error: ${error.message}`,
          isTyping: false,
          timestamp: new Date(),
        };
        setChatMessages(prevMessages => [...prevMessages, aiErrorMessage]);
      }
    } else {
      const aiUnsupportedMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'ai',
        text: 'Chat for this endpoint type is not supported.',
        isTyping: false,
        timestamp: new Date(),
      };
      setChatMessages(prevMessages => [...prevMessages, aiUnsupportedMessage]);
    }
    setIsSendingChatMessage(false);
  };
  
  const handleKnowledgeUpload = async (
    category: string | null,
    title: string,
    description: string,
    files: FileList | null,
    links: string[]
  ) => {
    if (!category) {
      logger.warn('[AIHub] Knowledge upload attempted without a category (for AI Hub organization).');
      alert('Category is required for knowledge upload (for AI Hub organization).');
      return;
    }
    if (!title.trim()) {
        alert('Title is required for knowledge upload.');
        return;
    }
    if ((!files || files.length === 0) && links.length === 0) {
      alert('Please provide at least one file or link to upload.');
      return;
    }

    logger.info(`[AIHub] Starting knowledge upload for AI Hub category: ${category}`, { title, description, filesCount: files?.length, linksCount: links.length });
    setIsUploadModalOpen(false); 

    const uploadPromises: Promise<any>[] = [];

    if (files && files.length > 0) {
      if (!graphContext.uploadBinaryFileToSharePoint) {
        logger.error('[AIHub] SharePoint upload function is not available. Check useMicrosoftGraph hook.');
        alert('Error: SharePoint upload functionality is not available.');
        return;
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uniqueFileName = `${uuidv4()}-${file.name}`;
        
        const uploadPromise = graphContext.uploadBinaryFileToSharePoint(
          file,
          uniqueFileName,
          KB_SHAREPOINT_SITEPATH,
          KB_SHAREPOINT_LIBRARY_NAME,
          KB_SHAREPOINT_TARGET_FOLDER
        ).then(sharepointUrl => {
          if (sharepointUrl) {
            logger.success(`[AIHub] File ${file.name} uploaded to SharePoint: ${sharepointUrl}`);
            const docDataForDocumentsTable = {
              name: title || file.name,
              type: file.type || 'application/octet-stream',
              size: file.size.toString(),
              owner: user?.id ? user.id.toString() : 'unknown',
              url: sharepointUrl,
              unit_id: null,
              shared: false,
            };
            return supabase.from('documents').insert(docDataForDocumentsTable);
          } else {
            throw new Error(`Failed to upload ${file.name} to SharePoint. ${graphContext.lastError || ''}`);
          }
        });
        uploadPromises.push(uploadPromise);
      }
    }

    if (links && links.length > 0) {
      links.forEach(link => {
        if (link.trim()) {
          const docDataForDocumentsTable = {
            name: title, 
            type: 'link',
            size: '0',
            owner: user?.id ? user.id.toString() : 'unknown',
            url: link,
            unit_id: null, 
            shared: false, 
          };
          uploadPromises.push(
            new Promise(async (resolve, reject) => {
              try {
                const response = await supabase.from('documents').insert(docDataForDocumentsTable);
                if (response.error) {
                  logger.error('[AIHub] Error inserting link to documents table:', { link, error: response.error });
                  reject(response.error);
                } else {
                  resolve(response);
                }
              } catch (error) {
                logger.error('[AIHub] Exception inserting link to documents table:', { link, error });
                reject(error);
              }
            })
          );
        }
      });
    }

    try {
      const results = await Promise.allSettled(uploadPromises);
      let successCount = 0;
      let errorCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const supaResult = result.value as any; 
          if (supaResult && supaResult.error) {
            logger.error(`[AIHub] Error saving item to 'documents' table (Index ${index}):`, supaResult.error);
            errorCount++;
          } else {
            logger.success(`[AIHub] Item (Index ${index}) processed and saved to 'documents' table.`);
            successCount++;
          }
        } else {
          logger.error(`[AIHub] Error processing item (Index ${index}):`, result.reason);
          errorCount++;
        }
      });

      if (errorCount > 0) {
        alert(`Knowledge upload partially failed. ${successCount} items succeeded, ${errorCount} items failed. Check console for details.`);
      } else {
        alert(`Successfully uploaded and saved ${successCount} knowledge items to the documents table!`);
      }

    } catch (overallError) {
      logger.error('[AIHub] Critical error during batch knowledge upload to documents table:', overallError);
      alert('An unexpected error occurred during the upload process. Check console for details.');
    } finally {
    }
  };

  const openUploadModalForArea = (areaTitle: string) => {
    setSelectedKnowledgeArea(areaTitle);
    setIsUploadModalOpen(true);
  };

  const knowledgeAreas = [
    { 
      title: 'Organizational Policies', 
      description: 'Access and query all organizational policies and procedures',
      icon: FileText 
    },
    { 
      title: 'Technical Knowledge Base', 
      description: 'Technical documentation and troubleshooting guides',
      icon: Lightbulb 
    },
    { 
      title: 'Project Management', 
      description: 'Best practices and organizational standards for projects',
      icon: MessageSquare 
    },
    { 
      title: 'Employee Resources', 
      description: 'HR information, benefits, and professional development',
      icon: Search 
    },
  ];

  const uiIsActuallyLoading = isAuthLoading || msalInProgress !== 'none' || isConfigLoading;
  const canEditSettings = !uiIsActuallyLoading && isSystemAdmin;

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the entire chat history?")) {
      setChatMessages([
        {
          id: uuidv4(),
          sender: 'ai',
          text: "Hello! I'm your SCPNG AI Assistant. How can I help you today?", // Use the constant if available elsewhere
          isTyping: false,
          timestamp: new Date(),
        }
      ]);
      setQuery(''); // Clear input field as well
    }
  };

  const handleCopyMessage = (textToCopy: string, messageId: string) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000); // Revert icon after 2 seconds
      })
      .catch(err => {
        logger.error('[AIHub] Failed to copy text: ', err);
        // Optionally, show an error toast to the user
      });
  };

  // useEffect to fetch uploaded files
  useEffect(() => {
    const fetchUploadedFiles = async () => {
      if (!user) {
        setIsLoadingFiles(false);
        // Or setUploadedSharePointFiles([]) if you only want to show files when logged in
        return;
      }
      setIsLoadingFiles(true);
      setLoadFilesError(null);
      try {
        const { data, error } = await supabase
          .from('documents') // Your Supabase table name for documents
          .select('id, name, url, type, created_at')
          // .eq('owner', user.id) // Uncomment to filter by current user
          .order('created_at', { ascending: false })
          .limit(10); // Limit for now, consider pagination later

        if (error) {
          throw error;
        }
        if (data) {
          setUploadedSharePointFiles(data as UploadedFile[]);
        }
      } catch (error: any) {
        logger.error('[AIHub] Error fetching uploaded documents:', error);
        setLoadFilesError('Failed to load uploaded documents. Please try again later.');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    // Fetch files when the component mounts or user changes
    // Avoid fetching if auth is still loading to ensure user.id is available
    if (!isAuthLoading) {
        fetchUploadedFiles();
    }
  }, [user, isAuthLoading]);

  // Helper function to render the AI Chat Interface
  const renderAIChatInterface = (isFullScreenInstance: boolean) => {
    const initialGreetingText = "Hello! I'm your SCPNG AI Assistant. How can I help you today?";
    const shouldShowPlaceholder = 
      chatMessages.length === 1 && 
      chatMessages[0].sender === 'ai' && 
      chatMessages[0].text === initialGreetingText && 
      !chatMessages[0].isTyping;

    return (
      <Card className={cn(
        "flex flex-col",
        isFullScreenInstance 
          ? "w-full h-full rounded-none border-none shadow-none" 
          : "mb-6"
      )}>
        <CardHeader className={cn(isFullScreenInstance && "border-b", "py-3 px-4")}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {isFullScreenInstance && (
                <img src="/images/SCPNG Original Logo.png" alt="SCPNG Logo" className="h-8 w-auto" />
              )}
              <CardTitle className="flex items-center">
                {!isFullScreenInstance && <Bot className="mr-2 text-intranet-primary" size={20} />} 
                AI Assistant
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleClearChat} className="h-8 w-8" title="Clear chat">
                <Trash2 size={16} />
              </Button>
              <Select value={currentAiModeId} onValueChange={setCurrentAiModeId} disabled={isFullScreenInstance}>
                <SelectTrigger className="w-[180px] sm:w-[200px] text-xs h-8">
                  <Settings className="mr-1 h-3 w-3" /> <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  {aiModes.map(mode => (
                    <SelectItem key={mode.id} value={mode.id} className="text-xs">
                      {mode.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setIsChatFullScreen(!isChatFullScreen)} className="h-8 w-8" title={isChatFullScreen ? "Exit full screen" : "Enter full screen"}>
                {isChatFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
            </div>
          </div>
          {!isFullScreenInstance && (
            <CardDescription className="mt-2">
              Ask questions and get intelligent responses. Current mode: <span className="font-semibold">{aiModes.find(m=>m.id === currentAiModeId)?.title || 'Unknown'}</span>.
              {isSystemAdmin && " Configure API settings below."}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={cn("flex-1 flex flex-col overflow-hidden", isFullScreenInstance ? "p-4 lg:p-6" : "p-4")}>
          <div 
            ref={messagesContainerRef} 
            className={cn(
              "flex-1 overflow-y-auto mb-4", 
              isFullScreenInstance ? "bg-transparent" : "bg-gray-50 rounded-lg", // Keep rounded-lg for normal view if it has bg-gray-50
              !isFullScreenInstance && "p-4" // Apply padding for normal view only if not using placeholder
            )}
          >
            {shouldShowPlaceholder ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Bot size={isFullScreenInstance ? 48 : 36} className="text-gray-400 mb-4" />
                <h2 className={cn("font-semibold text-gray-600", isFullScreenInstance ? "text-xl" : "text-lg")}>
                  What can I help with?
                </h2>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div 
                  key={message.id}
                  className={cn(
                    "mb-3 flex", 
                    message.sender === 'user' ? 'justify-end' : 'justify-start',
                    isFullScreenInstance && "max-w-3xl mx-auto w-full px-2" // Apply this only in FS for actual messages
                  )}
                >
                  <div 
                    className={`inline-block rounded-lg p-3 max-w-[80%] break-words relative group ${
                      message.sender === 'user' 
                        ? 'bg-intranet-primary text-white' 
                        : isFullScreenInstance ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white border border-gray-200'
                    }`}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {message.text}
                    {message.sender === 'ai' && message.isTyping && (
                      <span className="ai-cursor"></span>
                    )}
                    {message.sender === 'ai' && !message.isTyping && message.text && (
                      <Button 
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-300/50 hover:bg-gray-400/70 dark:bg-gray-600/50 dark:hover:bg-gray-500/70 p-1 rounded-full"
                        onClick={() => handleCopyMessage(message.fullText || message.text, message.id)}
                        title="Copy response"
                      >
                        {copiedMessageId === message.id ? <Check size={14} className="text-green-600" /> : <ClipboardCopy size={14} className="text-gray-600 dark:text-gray-300" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isSendingChatMessage && chatMessages[chatMessages.length -1]?.sender === 'user' && (
                <div className={cn("flex justify-start", isFullScreenInstance && "max-w-3xl mx-auto w-full px-2")}>
                    <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-lg bg-gray-200 text-gray-800">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                </div>
            )}
          </div>
          
          <form onSubmit={handleSendChatMessage} className={cn("flex gap-2 items-center", isFullScreenInstance && "max-w-3xl mx-auto w-full pt-2 pb-4 px-2")}>
            <Input 
              placeholder={isFullScreenInstance ? "Ask anything..." : "Type your question..."} 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn("flex-1", isFullScreenInstance && "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-intranet-primary focus:border-intranet-primary h-12 text-base")}
              disabled={isSendingChatMessage || uiIsActuallyLoading || (!apiKey || !apiEndpoint)}
            />
            <Button 
              type="submit" 
              className={cn(
                "bg-intranet-primary hover:bg-intranet-secondary",
                isFullScreenInstance && "h-12 w-12 rounded-full p-0"
              )}
              disabled={isSendingChatMessage || !query.trim() || uiIsActuallyLoading || (!apiKey || !apiEndpoint)}
            >
              {isSendingChatMessage ? <Loader2 className="h-5 w-5" /> : <Send size={isFullScreenInstance ? 20 : 18} />}
            </Button>
          </form>
           {(!apiKey || !apiEndpoint) && !uiIsActuallyLoading && !isFullScreenInstance && (
              <p className="text-xs text-red-500 mt-2">
                AI Assistant is not fully configured. Admins: please set API Key and Endpoint in the 'AI Configuration' section.
              </p>
            )}
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout hideNavAndFooter={isChatFullScreen}>
      {!isChatFullScreen && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">AI Knowledge Hub</h1>
          <Input placeholder="Search across organizational knowledge... (feature coming soon)" className="mt-2 mb-4" disabled /> 
          <p className="text-gray-500">Access AI-powered insights and search across organizational knowledge</p>
        </div>
      )}

      {/* Normal View Layout */}
      {!isChatFullScreen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cn("lg:col-span-2", !isSystemAdmin && "lg:col-span-3")}>
            {renderAIChatInterface(false)} {/* AI Assistant Card in normal flow */}

            <h2 className="text-xl font-semibold my-4">Popular Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "What are our current IT security protocols?",
                "How do I submit a vacation request?",
                "When is the next company-wide meeting?",
                "Where can I find the latest project templates?"
              ].map((question, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4 font-normal text-left"
                  onClick={() => {
                    if (!apiKey || !apiEndpoint) {
                      const userQ: ChatMessage = {
                        id: uuidv4(),
                        sender: 'user', 
                        text: question,
                        timestamp: new Date()
                      };
                      const aiError: ChatMessage = {
                        id: uuidv4(),
                        sender: 'ai', 
                        text: "AI is not configured. Please set API Key and Endpoint.",
                        isTyping: false,
                        timestamp: new Date()
                      };
                      setChatMessages(prev => [...prev, userQ, aiError]);
                      return;
                    }
                    setQuery(question);
                    handleSendChatMessage(); 
                  }}
                  disabled={uiIsActuallyLoading || (!apiKey || !apiEndpoint)}
                >
                  <MessageSquare size={16} className="mr-2 text-intranet-primary flex-shrink-0" />
                  {question}
                </Button>
              ))}
            </div>

            {/* Section for Uploaded SharePoint Files */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3">Uploaded Knowledge Documents</h2>
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-gray-500">Loading documents...</span>
                </div>
              ) : loadFilesError ? (
                <p className="text-red-500">{loadFilesError}</p>
              ) : uploadedSharePointFiles.length === 0 ? (
                <p className="text-gray-500">No documents have been uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {uploadedSharePointFiles.map(file => (
                    <a 
                      key={file.id} 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-card hover:bg-accent rounded-lg shadow-sm transition-colors border border-border group"
                    >
                      {file.type === 'link' ? 
                        <LinkIcon className="h-5 w-5 mr-3 text-intranet-primary flex-shrink-0" /> : 
                        <FileText className="h-5 w-5 mr-3 text-intranet-primary flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-intranet-primary">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-intranet-primary ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {isSystemAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Areas</CardTitle>
                  <CardDescription>Upload documents or links to specialized knowledge domains.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {knowledgeAreas.map((area, index) => (
                    <div 
                      key={index} 
                      className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => openUploadModalForArea(area.title)}
                    >
                      <div className="bg-intranet-light p-2 rounded-lg mr-3">
                        <area.icon size={18} className="text-intranet-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{area.title}</h3>
                        <p className="text-sm text-gray-500">{area.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
            {isSystemAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Configuration</CardTitle>
                  <CardDescription>Manage API settings for the AI Assistant. (Stored in shared news_api_settings ID: {GLOBAL_SETTINGS_ID})</CardDescription>
                   {lastUpdatedBy && !uiIsActuallyLoading && (
                      <p className="text-xs text-gray-500 pt-1">Last updated by user ID: {lastUpdatedBy}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {uiIsActuallyLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-gray-500">Loading AI Settings...</span>
                    </div>
                ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aiApiKey">API Key</Label>
                    <Input
                      id="aiApiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={canEditSettings ? "Enter AI API Key" : "API Key"}
                      disabled={!canEditSettings || isSaving || isTesting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="aiApiEndpoint">API Endpoint</Label>
                    <Input
                      id="aiApiEndpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder={canEditSettings ? "Enter AI API Endpoint" : "API Endpoint"}
                      disabled={!canEditSettings || isSaving || isTesting}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Button 
                      onClick={handleTestAiConnection} 
                      disabled={isTesting || isSaving || !canEditSettings || (!apiKey && !apiEndpoint) }
                      variant="outline"
                    >
                      {isTesting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing...</>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                    <Button 
                        onClick={handleSaveAiSettings} 
                        disabled={isSaving || isTesting || !canEditSettings } 
                    >
                    {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                        ) : (
                        'Save Settings'
                    )}
                    </Button>
                  </div>
                   {testMessage && (
                      <p className={`text-sm ${testMessageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {testMessage}
                      </p>
                    )}
                  {saveStatus && !isSaving && (
                    <p className={`text-sm ${saveStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{saveStatus}</p>
                  )}
                </div>
                )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Full Screen View Layout */}
      {isChatFullScreen && (
        <div className="fixed inset-0 z-50 flex flex-col p-0 m-0 bg-background dark:bg-intranet-dark">
          {renderAIChatInterface(true)} {/* AI Assistant Card in full screen mode */}
        </div>
      )}

      <KnowledgeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedKnowledgeArea(null);
        }}
        onUpload={(title, description, files, links) => handleKnowledgeUpload(selectedKnowledgeArea, title, description, files, links)}
        knowledgeAreaTitle={selectedKnowledgeArea}
      />
    </PageLayout>
  );
};

export default AIHub;
