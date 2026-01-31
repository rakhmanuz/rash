import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Login va parol kiriting')
        }
        
        const rememberMe = credentials.rememberMe === 'true'

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        if (!user.password) {
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Siz tizimdan uzulgansiz')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        return {
          id: user.id,
          email: null,
          username: user.username,
          name: user.name,
          image: user.image,
          role: user.role,
          rememberMe: rememberMe,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 kun (default: 30 kun, lekin cookie maxAge bilan birga ishlaydi)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 kun
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 kun - eslab qolish uchun
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        // Remember me - agar belgilangan bo'lsa, maxAge ni uzaytirish
        if ((user as any).rememberMe) {
          token.maxAge = 30 * 24 * 60 * 60 // 30 kun
        } else {
          token.maxAge = 24 * 60 * 60 // 1 kun (default)
        }
      }
      // Token yangilanishida maxAge ni saqlash
      if (token.maxAge) {
        // maxAge ni token'da saqlash
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
