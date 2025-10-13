'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '../types/item'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()  // Use default client; let AuthForm handle rememberMe

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Profile fetch error:', error.message)
      return
    }
    if (profileData) {
      const typedProfile = profileData as Profile
      setProfile(typedProfile)
      setIsAdmin(typedProfile.role === 'admin')
    }
  }, [supabase])

  useEffect(() => {
    const getAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }
    getAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth change event:', _event, 'Session user:', session?.user?.email ?? 'none')
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error.message)
    // No need to recreate client; session clears automatically
  }, [supabase])

  return { user, profile, isAdmin, loading, signOut }
}