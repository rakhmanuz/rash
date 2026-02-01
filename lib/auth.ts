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
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Login va parol kiriting')
        }

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

        // Role'ni to'g'ri formatlash - katta harf bilan
        const userRole = (user.role || 'STUDENT').toUpperCase()
        
        return {
          id: user.id,
          email: null,
          username: user.username,
          name: user.name,
          image: user.image,
          role: userRole,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 kun (default)
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 1 kun (default)
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 1 kun (default)
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
        // Role'ni to'g'ri formatlash - katta harf bilan
        const userRole = ((user as any).role || 'STUDENT').toUpperCase()
        token.role = userRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // Role'ni to'g'ri formatlash - katta harf bilan
        const userRole = ((token.role as string) || 'STUDENT').toUpperCase()
        session.user.role = userRole
      }
      return session
    },
  },
}
