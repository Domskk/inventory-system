'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams() // Use Next.js hook for query params
  const token = searchParams?.get('token') // Safely access token
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }

    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000) // Redirect to home after 2 seconds
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Password updated successfully! Redirecting to home...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded border border-white/20 bg-white/10 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
            required
            aria-label="New password"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-all duration-300 shadow-lg"
            aria-label="Submit new password"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading reset page...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}