import { useEffect, useState } from "react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { createClient } from "@supabase/supabase-js";

// MSAL config
const msalConfig = {
  auth: {
    clientId: "648a96d7-e3f5-4e13-8084-ba0b74dbb56f",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "https://dmasclpgspatxncspcvt.supabase.co/auth/v1/callback",
  },
};

// Supabase config
const supabaseUrl = "https://dmasclpgspatxncspcvt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MSAL
  useEffect(() => {
    const msalInstanceTemp = new PublicClientApplication(msalConfig);
    
    msalInstanceTemp.initialize().then(() => {
      // Set event callbacks
      msalInstanceTemp.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
          const account = msalInstanceTemp.getAllAccounts()[0];
          if (account) {
            setUser(account);
            fetchNotes(account.username);
          }
        }
      });
      
      // Check if user is already signed in
      const accounts = msalInstanceTemp.getAllAccounts();
      if (accounts.length > 0) {
        setUser(accounts[0]);
        fetchNotes(accounts[0].username);
      }
      
      setMsalInstance(msalInstanceTemp);
      setIsInitialized(true);
    }).catch(error => {
      console.error("MSAL initialization failed", error);
    });
  }, []);

  // Login with Microsoft
  const login = async () => {
    if (!msalInstance || !isInitialized) {
      console.error("MSAL is not initialized yet");
      return;
    }
    
    try {
      const response = await msalInstance.loginPopup({
        scopes: ["user.read"],
      });
      const account = response.account;
      setUser(account);
      fetchNotes(account.username); // Load notes after login
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // Logout
  const logout = () => {
    if (!msalInstance) return;
    
    msalInstance.logoutPopup();
    setUser(null);
    setNotes([]);
  };

  // Fetch notes from Supabase
  const fetchNotes = async (email: string) => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_email", email);
    if (error) console.error("Fetch error:", error);
    else setNotes(data || []);
  };

  // Create a new note
  const addNote = async () => {
    if (!newNote || !user) return;

    const { data, error } = await supabase.from("notes").insert([
      {
        content: newNote,
        user_email: user.username,
      },
    ]);

    if (error) console.error("Insert error:", error);
    else {
      // Refresh notes after adding
      fetchNotes(user.username);
      setNewNote("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📝 Microsoft Auth + Supabase CRUD</h1>

      {!user ? (
        <button onClick={login} disabled={!isInitialized}>
          {isInitialized ? "Login with Microsoft" : "Initializing..."}
        </button>
      ) : (
        <div>
          <p>Welcome, {user.name || user.username}!</p>
          <button onClick={logout}>Logout</button>

          <div style={{ marginTop: 20 }}>
            <h2>Your Notes</h2>
            <div style={{ display: "flex", marginBottom: 10 }}>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note..."
                style={{ flexGrow: 1, marginRight: 8, padding: 8 }}
              />
              <button onClick={addNote}>Add</button>
            </div>

            {notes.length === 0 ? (
              <p>No notes yet. Add your first note!</p>
            ) : (
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {notes.map((note) => (
                  <li 
                    key={note.id} 
                    style={{ 
                      padding: 12, 
                      marginBottom: 8, 
                      backgroundColor: "#f9f9f9",
                      borderRadius: 4,
                      border: "1px solid #eee"
                    }}
                  >
                    {note.content}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}