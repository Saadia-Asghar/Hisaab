import { doc, getDoc, setDoc } from 'firebase/firestore'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db, isFirebaseConfigured } from './firebase'

const AVATAR_COLORS = ['#4F6EF7', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']

export function randomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

/** Create a profiles doc when missing (OAuth / first login). Idempotent. */
export async function ensureProfileForUser(user) {
  if (!db || !user?.uid) return

  const ref = doc(db, 'profiles', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  const name =
    user.displayName?.trim() ||
    (typeof user.email === 'string' && user.email.includes('@')
      ? user.email.split('@')[0]
      : '') ||
    'User'

  await setDoc(ref, {
    name,
    avatar_color: randomAvatarColor(),
    phone: null,
    created_at: new Date().toISOString(),
  })
}

export async function signInWithGoogle() {
  try {
    if (!isFirebaseConfigured || !auth) {
      return new Error('Add Firebase keys to .env.local')
    }
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    return null
  } catch (e) {
    return e
  }
}
