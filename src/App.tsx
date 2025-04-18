import React, { useEffect, useState } from 'react'
import { createClient, User } from '@supabase/supabase-js'
import { LogIn, LogOut, CheckCircle } from 'lucide-react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Define Supabase client
const supabase = createClient(
  'https://dmasclpgspatxncspcvt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM'
)

const LoginPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) {
        navigate('/confirmation')
      }
    })

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (event === 'SIGNED_IN' && session?.user) {
          navigate('/confirmation')
        }
      }
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [navigate])

  const signInWithAzure = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email offline_access',
        redirectTo: window.location.origin + '/confirmation'
      },
    })
    if (error) {
      console.error('Login error:', error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-6 md:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Supabase Azure Auth</h2>
            <div className="h-1 w-16 bg-blue-500 mx-auto mb-6"></div>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md text-gray-700">
                You're not currently signed in.
              </div>
              <button
                onClick={signInWithAzure}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors"
              >
                <LogIn size={18} />
                <span>Login with Microsoft</span>
              </button>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
          Protected with Supabase Authentication
        </div>
      </div>
    </div>
  )
}

const ConfirmationPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
      } else {
        navigate('/')
      }
    })

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/')
        }
      }
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [navigate])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error.message)
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8 md:px-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800">Successfully Logged In!</h2>
            
            {user && (
              <div className="bg-gray-50 w-full p-4 rounded-md text-center">
                <p className="text-sm text-gray-600 mb-1">Logged in as</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            )}
            
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-md transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
          Protected with Supabase Authentication
        </div>
      </div>
    </div>
  )
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
  )

  if (!user) return <Navigate to="/" replace />
  
  return <>{children}</>
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route 
          path="/confirmation" 
          element={
            <ProtectedRoute>
              <ConfirmationPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App