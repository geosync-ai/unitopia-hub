import React, { useEffect, useState } from "react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { createClient } from "@supabase/supabase-js";

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: "648a96d7-e3f5-4e13-8084-ba0b74dbb56f",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "https://unitopia-hub.vercel.app/",
  },
};

// Supabase Configuration
const supabaseUrl = "https://dmasclpgspatxncspcvt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [msalInstance, setMsalInstance] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const instance = new PublicClientApplication(msalConfig);

    instance.initialize().then(() => {
      instance.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
          const account = instance.getAllAccounts()[0];
          if (account) {
            setUser(account);
            fetchNotes(account.username);
          }
        }
      });

      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        setUser(accounts[0]);
        fetchNotes(accounts[0].username);
      }

      setMsalInstance(instance);
      setIsInitialized(true);
    });
  }, []);

  const fetchMicrosoftUserProfile = async (accessToken) => {
    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const profileData = await response.json();
      setProfile(profileData);
      console.log("Microsoft profile:", profileData);
    } catch (err) {
      console.error("Error fetching Microsoft profile:", err);
    }
  };

  const login = async () => {
    if (!msalInstance || !isInitialized) return;

    try {
      const response = await msalInstance.loginPopup({
        scopes: ["User.Read", "User.ReadBasic.All"],
      });
      const account = response.account;
      setUser(account);
      fetchNotes(account.username);
      await fetchMicrosoftUserProfile(response.accessToken);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => {
    if (!msalInstance) return;

    msalInstance.logoutPopup();
    setUser(null);
    setProfile(null);
    setNotes([]);
  };

  const fetchNotes = async (email) => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_email", email);
    if (error) console.error("Fetch error:", error);
    else setNotes(data || []);
  };

  const addNote = async () => {
    if (!newNote || !user) return;

    const { error } = await supabase.from("notes").insert([
      {
        content: newNote,
        user_email: user.username,
      },
    ]);

    if (error) console.error("Insert error:", error);
    else {
      fetchNotes(user.username);
      setNewNote("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📝 Microsoft Auth + Supabase Notes</h1>

      {!user ? (
        <button onClick={login} disabled={!isInitialized}>
          {isInitialized ? "Login with Microsoft" : "Initializing..."}
        </button>
      ) : (
        <div>
          <p>Welcome, {user.name || user.username}!</p>
          <button onClick={logout}>Logout</button>

          {profile && (
            <div style={{ marginTop: 20 }}>
              <h3>👤 Microsoft Profile</h3>
              <p><strong>Name:</strong> {profile.displayName}</p>
              <p><strong>Email:</strong> {profile.mail || profile.userPrincipalName}</p>
              <p><strong>Job Title:</strong> {profile.jobTitle || "N/A"}</p>
              <p><strong>Phone:</strong> {profile.mobilePhone || profile.businessPhones?.[0] || "N/A"}</p>
              <p><strong>Office:</strong> {profile.officeLocation || "N/A"}</p>
            </div>
          )}

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

export default App;
