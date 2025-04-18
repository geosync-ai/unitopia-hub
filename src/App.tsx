import React, { useEffect, useState } from 'react'
import { createClient, User } from '@supabase/supabase-js'
import { LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Define Supabase client
const supabase = createClient(
  'https://dmasclpgspatxncspcvt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM'
)

// Logger function
const logger = {
  info: (message, data = {}) => {
    console.log(`%c INFO: ${message}`, 'color: blue; font-weight: bold', data)
  },
  success: (message, data = {}) => {
    console.log(`%c SUCCESS: ${message}`, 'color: green; font-weight: bold', data)
  },
  error: (message, error = {}) => {
    console.error(`%c ERROR: ${message}`, 'color: red; font-weight: bold', error)
  },
  warn: (message, data = {}) => {
    console.warn(`%c WARNING: ${message}`, 'color: orange; font-weight: bold', data)
  }
}

const LoginPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    logger.info('Initializing login page')
    
    // Set timeout to detect slow loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        logger.warn('Auth check is taking longer than expected')
      }
    }, 3000)

    // Get current user
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error) {
          logger.error('Error checking authentication status', error)
          setError(error.message)
          setLoading(false)
          return
        }
        
        if (data.user) {
          logger.success('User already authenticated', { userId: data.user.id })
          setUser(data.user)
          navigate('/confirmation')
        } else {
          logger.info('No authenticated user found')
          setLoading(false)
        }
      })
      .catch(err => {
        logger.error('Unexpected error in auth check', err)
        setError('Failed to check authentication status')
        setLoading(false)
      })

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info(`Auth state changed: ${event}`, { userId: session?.user?.id })
        
        if (event === 'SIGNED_IN' && session?.user) {
          logger.success('User signed in successfully', { userId: session.user.id })
          setUser(session.user)
          navigate('/confirmation')
        } else if (event === 'SIGNED_OUT') {
          logger.info('User signed out')
          setUser(null)
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      listener?.subscription?.unsubscribe()
      logger.info('Login page cleanup')
    }
  }, [navigate])

  const signInWithAzure = async () => {
    setLoading(true)
    setError(null)
    logger.info('Initiating Azure sign-in')
    
    try {
      // Clear any existing session first to prevent auth conflicts
      await supabase.auth.signOut()
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email offline_access',
          redirectTo: window.location.origin + '/confirmation'
        },
      })
      
      if (error) {
        logger.error('Azure login error', error)
        setError(error.message)
        setLoading(false)
        return
      }
      
      logger.success('Azure OAuth flow initiated', data)
      // Note: We don't set loading to false here because we're redirecting to Microsoft
    } catch (err) {
      logger.error('Unexpected error during sign-in', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const retryAuth = () => {
    setLoading(true)
    setError(null)
    logger.info('Retrying authentication')
    
    // Force clear any problematic session data
    try {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
    } catch (e) {
      logger.warn('Error clearing local storage', e)
    }
    
    // Force reload the auth state
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error) {
          logger.error('Error during auth retry', error)
          setError(error.message)
          setLoading(false)
          return
        }
        
        if (data.user) {
          logger.success('User authenticated on retry', { userId: data.user.id })
          setUser(data.user)
          navigate('/confirmation')
        } else {
          logger.info('No user found on retry')
          setLoading(false)
        }
      })
      .catch(err => {
        logger.error('Unexpected error during retry', err)
        setError('Failed to retry authentication')
        setLoading(false)
      })
  }

  const handleErrorDisplay = (errorMessage: string) => {
    // Make error messages more user-friendly
    if (errorMessage.includes('session missing')) {
      return 'Your login session has expired. Please sign in again.'
    }
    return errorMessage
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
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-center text-sm text-gray-500">Checking authentication status...</p>
              <button 
                onClick={retryAuth}
                className="mx-auto block text-sm text-blue-600 hover:underline mt-2"
              >
                Taking too long? Click to retry
              </button>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-red-700 font-medium">Authentication Error</p>
                  <p className="text-sm text-red-600 mt-1">{handleErrorDisplay(error)}</p>
                </div>
              </div>
              <button
                onClick={signInWithAzure}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors"
              >
                <LogIn size={18} />
                <span>Login with Microsoft</span>
              </button>
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
          Protected with Supabase Authentication
          <button 
            onClick={() => console.log('Auth debug:', { user, loading, error })}
            className="ml-2 text-blue-500 hover:underline text-xs"
          >
            Debug
          </button>
        </div>
      </div>
    </div>
  )
}

const ConfirmationPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    logger.info('Initializing confirmation page')
    
    // Get current user
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error) {
          logger.error('Error fetching user in confirmation page', error)
          setError(error.message)
          setLoading(false)
          return
        }
        
        if (data.user) {
          logger.success('User confirmed in confirmation page', { email: data.user.email })
          setUser(data.user)
          setLoading(false)
        } else {
          logger.warn('No authenticated user in confirmation page')
          navigate('/')
        }
      })
      .catch(err => {
        logger.error('Unexpected error in confirmation page', err)
        setLoading(false)
        navigate('/')
      })

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info(`Auth state changed in confirmation page: ${event}`)
        
        if (event === 'SIGNED_OUT') {
          logger.info('User signed out from confirmation page')
          navigate('/')
        }
      }
    )

    return () => {
      listener?.subscription?.unsubscribe()
      logger.info('Confirmation page cleanup')
    }
  }, [navigate])

  const signOut = async () => {
    try {
      logger.info('Initiating sign out')
      
      // Clear browser storage before sign out
      try {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
      } catch (e) {
        logger.warn('Error clearing storage during logout', e)
      }
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error('Error during sign out', error)
        setError(error.message)
        return
      }
      
      logger.success('User signed out successfully')
      // Force a page reload to clear all React state instead of using navigate
      window.location.href = '/'
    } catch (err) {
      logger.error('Unexpected error during sign out', err)
      setError('Failed to sign out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
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
                <p className="text-xs text-gray-500 mt-2">User ID: {user.id.substring(0, 8)}...</p>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md w-full">
                <p className="text-sm text-red-600">{error}</p>
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    logger.info('Checking protected route access')
    
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error) {
          logger.error('Auth error in protected route', error)
          setLoading(false)
          return
        }
        
        setUser(data.user)
        setLoading(false)
        
        if (data.user) {
          logger.success('Protected route access granted', { userId: data.user.id })
        } else {
          logger.warn('Protected route access denied - no user')
        }
      })
      .catch(err => {
        logger.error('Unexpected error in protected route', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-red-600 font-medium mb-2">Authentication Error</h3>
          <p className="text-gray-700">{error}</p>
          <a href="/" className="text-blue-600 hover:underline block mt-4">Return to Login</a>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />
  
  return <>{children}</>
}

const App = () => {
  // Detect if the app failed to load properly
  useEffect(() => {
    logger.info('App initialized', { 
      url: window.location.href,
      env: process.env.NODE_ENV
    })
    
    // Add global error handler
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Log to original console.error
      originalConsoleError.apply(console, args)
      
      // Check if this is a React error
      const errorText = args.join(' ')
      if (errorText.includes('React') || errorText.includes('Supabase')) {
        logger.error('React/Supabase error detected', { errorText })
      }
    }
    
    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      logger.error('Unhandled error', { 
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      })
    })
    
    // Check if app is taking too long to initialize
    const initTimeout = setTimeout(() => {
      logger.warn('App initialization taking longer than expected')
    }, 5000)
    
    return () => {
      clearTimeout(initTimeout)
      console.error = originalConsoleError
    }
  }, [])

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App