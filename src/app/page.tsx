'use client'
import { createClient } from './lib/supabase'
import { CubeIcon, UserIcon, EyeIcon, EyeSlashIcon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { motion, type Variants, AnimatePresence, easeOut } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './hooks/useAuth'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOut
    }
  }
}
const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0
  }
}
const formVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: -20
  }
}
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: easeOut }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: easeOut }
  }
}
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } }
}

function AuthForm({
  isSignUp,
  email,
  password,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onToggleMode,
  onForgotPassword,
  onGitHubLogin,
}: {
  isSignUp: boolean
  email: string
  password: string
  showPassword: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>, rememberMe: boolean) => void
  onToggleMode: () => void
  onForgotPassword?: () => void
  onGitHubLogin?: () => void
}) {
  const [rememberMe, setRememberMe] = useState(false)

  return (
    <AnimatePresence mode="wait">
      <motion.form
        key={isSignUp ? 'signup' : 'login'}
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3, ease: easeOut }}
        onSubmit={(e) => onSubmit(e, rememberMe)}
        role="form"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{isSignUp ? 'Sign Up' : 'Log In'}</h2>
          <p className="text-purple-200 mb-6">{isSignUp ? 'Create your account' : 'Welcome, Enter the information below'}</p>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-3 py-2 rounded border border-white/20 bg-white/10 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
            required
            aria-label="Email address"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-3 py-2 rounded border border-white/20 bg-white/10 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 pr-10"
              required
              aria-label="Password"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          <AnimatePresence>
            {!isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onForgotPassword?.(); }}
                  className="block text-right text-sm text-purple-300 hover:text-white underline"
                  aria-label="Forgot Password"
                >
                  Forgot Password?
                </a>
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    aria-label="Remember me"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-purple-300">
                    Remember me
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="submit"
            disabled={!email || !password}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
            aria-label={isSignUp ? 'Sign up' : 'Log in'}
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
          <div className="text-center text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"} {' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-purple-300 font-medium underline hover:text-white"
              aria-label={isSignUp ? 'Switch to log in' : 'Switch to sign up'}
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-600/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-slate-800 text-purple-300 text-sm">Or {isSignUp ? 'sign up' : 'sign in'} with</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onGitHubLogin}
            className="w-full bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg"
            aria-label="Sign in with GitHub"
          >
            GitHub
          </button>
        </div>
      </motion.form>
    </AnimatePresence>
  )
}

function LoadingModal({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 rounded-lg p-6 shadow-2xl z-50 text-center"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-white text-lg">Loading...</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ErrorModal({ message, onClose }: { message: string | null; onClose: () => void; }) {
  if (!message) return null

  return (
    <AnimatePresence>
      <>
        <motion.div
          className="fixed inset-0 bg-black/50 z-50"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        />
        <motion.div
          className="fixed top-1/2 left-1/1 transform -translate-x-1/2 -translate-y-1/2 bg-red-900/90 border border-red-500 rounded-lg p-6 shadow-2xl z-50 max-w-md w-full mx-4 text-center"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-red-200 hover:text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <p className="text-red-100 text-sm mb-4 whitespace-pre-wrap">{message}</p>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const clearError = useCallback(() => setError(null), [])

  // Only redirect after successful login, not during password reset
  useEffect(() => {
    if (!authLoading && user && !error?.includes('Password reset')) {
      router.replace('/view')
    }
  }, [authLoading, user, router, error])

  const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>, rememberMe: boolean) => {
    e.preventDefault()
    clearError()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    const client = createClient(rememberMe)
    setIsLoading(true)
    let authResult
    if (isSignUp) {
      authResult = await client.auth.signUp({ email, password })
    } else {
      authResult = await client.auth.signInWithPassword({ email, password })
    }
    
    setIsLoading(false)

    if (authResult.error) {
      setError(authResult.error.message)
    } else {
      if (isSignUp) {
        setError('Account created! Check your email to confirm your account.')
      } else {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }
      }
    }
  }, [isSignUp, email, password, clearError])

  const handleLogin = useCallback(async () => {
    clearError()
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      setIsLoading(false)
      setError(error.message)
    }
  }, [supabase, clearError])

  const handleForgotPassword = useCallback(async () => {
    clearError()
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    setIsLoading(true)
    const { error: forgotError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetpassword`
    })
    setIsLoading(false)
    if (forgotError) {
      setError(forgotError.message)
    } else {
      setError('Password reset email sent. Check your inbox and follow the link to set a new password.')
    }
  }, [email, supabase, clearError])

  const handleLogout = useCallback(async () => {
    await signOut()
    setError(null)
    router.replace('/')
  }, [signOut, router])

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at center, rgba(147, 51, 234, 0.2) 0%,
                          rgba(139, 92, 246, 0.1) 50%,
                          transparent 100%),
          linear-gradient(to bottom, #4c1d95 0%, #581c87 100%)
        `
      }}
    >
      <LoadingModal isVisible={isLoading} />
      <ErrorModal message={error} onClose={clearError} />

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-20 left-10 w-4 h-4 bg-purple-300 rounded-full"
          animate={{ y: [0, -30, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-3 h-3 bg-purple-200 rounded-full"
          animate={{ y: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-40 left-1/3 w-5 h-5 bg-purple-400 rounded-full"
          animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-2 h-2 bg-purple-500 rounded-full"
          animate={{ y: [0, 10, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center w-full max-w-md px-4"
      >
        <motion.div
          variants={iconVariants}
          transition={{ duration: 0.8, ease: easeOut }}
        >
          <CubeIcon className="w-16 h-16 text-purple-200 mx-auto mb-4 drop-shadow-lg" />
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-3xl font-bold text-white mb-2"
        >
          Inventrack
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg text-purple-100 mb-6"
        >
          Track stock, manage orders, and stay organized effortlessly.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="space-y-4"
        >
          <div className="bg-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <UserIcon className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <AuthForm
              isSignUp={isSignUp}
              email={email}
              password={password}
              showPassword={showPassword}
              onEmailChange={(value) => { setEmail(value); clearError(); }}
              onPasswordChange={(value) => { setPassword(value); clearError(); }}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSubmit={handleFormSubmit}
              onToggleMode={() => { setIsSignUp(!isSignUp); clearError(); }}
              onForgotPassword={handleForgotPassword}
              onGitHubLogin={handleLogin}
            />
            {user && (
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}