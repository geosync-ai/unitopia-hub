import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and anon public key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', // Your Supabase Project URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM' // Your Anon Public Key
)

type Task = {
  id: number
  name: string
  created_at: string
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')

  // Listen to auth changes
  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Fetch tasks after login
  useEffect(() => {
    if (session) fetchTasks()
  }, [session])

  const loginWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: 'https://dmasclpgspatxncspcvt.supabase.co/auth/v1/callback' // Your frontend URL
      }
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error.message)
    } else {
      setTasks(data || [])
    }
  }

  const addTask = async () => {
    if (!newTask.trim()) return

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ name: newTask }])
      .select()

    if (error) {
      console.error('Insert error:', error.message)
    } else {
      setTasks((prev) => [data![0], ...prev])
      setNewTask('')
    }
  }

  const deleteTask = async (id: number) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error.message)
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id))
    }
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl mb-4">Welcome to the Task App</h1>
        <button
          onClick={loginWithMicrosoft}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Login with Microsoft
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Tasks</h1>
        <button onClick={logout} className="text-red-600 font-medium">
          Logout
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task..."
          className="flex-1 border px-3 py-2 rounded"
        />
        <button onClick={addTask} className="bg-green-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>{task.name}</span>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
