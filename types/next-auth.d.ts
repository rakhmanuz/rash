import 'next-auth'
import type { LearningMode } from '@/lib/learning-mode'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      username?: string
      name?: string | null
      image?: string | null
      role?: string
      learningMode?: LearningMode
    }
  }

  interface User {
    id: string
    email?: string | null
    username?: string
    name?: string | null
    image?: string | null
    role?: string
    learningMode?: LearningMode
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
    learningMode?: LearningMode
    username?: string
    name?: string | null
    permissions?: Record<string, unknown> | null
  }
}
