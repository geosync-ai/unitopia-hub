import { useAuth } from "@/hooks/useAuth";
import Notes from "@/components/Notes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotesPage() {
  const { user, isAuthenticated, loginWithMicrosoft } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Notes</h1>
      
      {!isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>Microsoft Auth + Supabase</CardTitle>
            <CardDescription>
              Sign in with Microsoft to access your notes stored in Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button 
              onClick={loginWithMicrosoft}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login with Microsoft
            </button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {user?.name || user?.email}</CardTitle>
              <CardDescription>
                You're signed in with Microsoft. Your notes are synced with Supabase.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Notes />
        </div>
      )}
    </div>
  );
} 