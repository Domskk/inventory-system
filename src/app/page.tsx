// Updated: src/app/page.tsx (Integrate useAuth hook, useRouter for redirect, remove manual auth listeners)
'use client'
import { createClient } from './lib/supabase'
import { CubeIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { motion, type Variants, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './hooks/useAuth' // Add this import

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
    transition: { duration: 0.6, ease: 'easeOut' }
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
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
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
  onGitHubLogin
}: {
  isSignUp: boolean
  email: string
  password: string
  showPassword: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: () => void
  onToggleMode: () => void
  onForgotPassword?: () => void
  onGitHubLogin?: () => void
}) {
  const currentKey = isSignUp ? 'signup' : 'login'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentKey}
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
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
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-3 py-2 rounded border border-white/20 bg-white/10 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 pr-10"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-white"
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
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onForgotPassword?.(); 
                  }}
                  className="block text-right text-sm text-purple-300 hover:text-white underline"
                >
                  Forgot Password?
                </a>
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-purple-300">
                    Remember me
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={onSubmit}
            disabled={!email || !password}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
          <div className="text-center text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"} {' '}
            <button
              onClick={onToggleMode}
              className="text-purple-300 font-medium underline hover:text-white"
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
            onClick={onGitHubLogin}
            className="w-full bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg"
          >
            GitHub
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Home() {
  const { user, loading: authLoading } = useAuth() // Use the hook
  const router = useRouter() // Add router
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

  // Redirect if authenticated (useEffect handles post-auth changes via hook)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/view')
    }
  }, [authLoading, user, router])

  // Remove the old useEffect with manual getUser and onAuthStateChange

  const handleLogin = useCallback(() => {
    supabase.auth.signInWithOAuth({ provider: 'github' })
  }, [supabase])

  const handleEmailAuth = useCallback(async () => {
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      alert(error.message)
    } else {
      if (isSignUp) {
        alert('Account created! Check your email to confirm your account.')
      } else {
        // Redirect will happen via useAuth's onAuthStateChange -> this useEffect
      }
    }
  }, [isSignUp, email, password, supabase])

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      alert('Please enter your email address.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) {
      alert(error.message)
    } else {
      alert('Password reset email sent. Check your inbox.')
    }
  }, [email, supabase])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
        <div className="p-8 flex items-center justify-center">Loading...</div>
      </div>
    )
  }

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
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="absolute top-20 left-10 w-4 h-4 bg-purple-300 rounded-full"
          animate={{ y: [0, -30, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-3 h-3 bg-purple-200 rounded-full"
          animate={{ y: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div 
          className="absolute bottom-40 left-1/3 w-5 h-5 bg-purple-400 rounded-full"
          animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div 
          className="absolute bottom-20 right-1/4 w-2 h-2 bg-purple-500 rounded-full"
          animate={{ y: [0, 10, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
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
          transition={{ duration: 0.8, ease: 'easeOut' }}
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
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSubmit={handleEmailAuth}
              onToggleMode={() => setIsSignUp(!isSignUp)}
              onForgotPassword={handleForgotPassword}
              onGitHubLogin={handleLogin}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}