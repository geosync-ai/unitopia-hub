import { useEffect, useState } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { createClient } from "@supabase/supabase-js";

// MSAL config
const msalConfig = {
  auth: {
    clientId: "YOUR_MICROSOFT_CLIENT_ID",
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
    redirectUri: "http://localhost:3000",
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

// Supabase config
const supabaseUrl = "https://dmasclpgspatxncspcvt.supabase.co";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  // Login with Microsoft
  const login = async () => {
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
    else setNotes(data);
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
      setNotes([...notes, ...data]);
      setNewNote("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📝 Microsoft Auth + Supabase CRUD</h1>

      {!user ? (
        <button onClick={login}>Login with Microsoft</button>
      ) : (
        <div>
          <p>Welcome, {user.name || user.username}!</p>
          <button onClick={logout}>Logout</button>

          <div style={{ marginTop: 20 }}>
            <h2>Your Notes</h2>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note..."
            />
            <button onClick={addNote}>Add</button>

            <ul>
              {notes.map((note) => (
                <li key={note.id}>{note.content}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
