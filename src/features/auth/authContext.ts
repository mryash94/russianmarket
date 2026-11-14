import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'customer' | 'support'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  role: UserRole | null
  isAdmin: boolean
  isAuthorizedAdmin: boolean
  loading: boolean
  error: string | null
  notice: string | null
  isPasswordRecovery: boolean
  setIsPasswordRecovery: (value: boolean) => void
  signInWithGoogle: (returnUrl?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  sendPasswordResetEmail: (email: string) => Promise<void>
  updateUserPassword: (password: string) => Promise<void>
  resendConfirmationEmail: (email: string) => Promise<void>
  sendEmailOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<boolean>
  signOut: () => Promise<void>
  clearMessages: () => void
  setPendingCheckoutProduct: (productId: string) => void
  getPendingCheckoutProduct: () => string | null
  clearPendingCheckoutProduct: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider.')
  return context
}
