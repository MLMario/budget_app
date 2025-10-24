'use server'

import { signUp, signIn, signOut, resetPassword, getSession } from '@/services/auth.service'

export async function signUpAction(email: string, password: string) {
  return await signUp({ email, password })
}

export async function signInAction(email: string, password: string) {
  return await signIn({ email, password })
}

export async function signOutAction() {
  return await signOut()
}

export async function resetPasswordAction(email: string) {
  return await resetPassword({ email })
}

export async function getSessionAction() {
  return await getSession()
}
