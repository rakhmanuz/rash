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

        // Database'dan to'g'ridan-to'g'ri role'ni o'qish va formatlash
        let userRole = 'STUDENT'
        if (user.role) {
          userRole = user.role.toUpperCase().trim()
        }
        
        // Agar role noto'g'ri bo'lsa, STUDENT qilib qo'yish
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'TEACHER' && userRole !== 'STUDENT') {
          userRole = 'STUDENT'
        }
        
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        let userRole = ((user as any).role || 'STUDENT').toUpperCase().trim()
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'TEACHER' && userRole !== 'STUDENT') {
          userRole = 'STUDENT'
        }
        token.role = userRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        let userRole = ((token.role as string) || 'STUDENT').toUpperCase().trim()
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'TEACHER' && userRole !== 'STUDENT') {
          userRole = 'STUDENT'
        }
        session.user.role = userRole
      }
      return session
    },
  },
}
