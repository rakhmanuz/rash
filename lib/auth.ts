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
      async authorize(credentials, req) {
        const normalizedUsername = (credentials?.username || '').trim()
        const incomingPassword = credentials?.password || ''
        if (!normalizedUsername || !incomingPassword) {
          console.warn('[AUTH] Missing credentials', { normalizedUsername })
          throw new Error('Login va parol kiriting')
        }

        const user = await prisma.user.findUnique({
          where: { username: normalizedUsername },
        })

        if (!user) {
          console.warn('[AUTH] User not found', { normalizedUsername })
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        if (!user.password) {
          console.warn('[AUTH] Password missing in DB', { userId: user.id, normalizedUsername })
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        // Check if user is active
        if (!user.isActive) {
          console.warn('[AUTH] User inactive', { userId: user.id, role: user.role, normalizedUsername })
          throw new Error('Siz tizimdan uzulgansiz')
        }

        const isPasswordValid = await bcrypt.compare(
          incomingPassword,
          user.password
        )

        if (!isPasswordValid) {
          console.warn('[AUTH] Password mismatch', { userId: user.id, role: user.role, normalizedUsername })
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        console.info('[AUTH] Login success', { userId: user.id, role: user.role, normalizedUsername })

        return {
          id: user.id,
          email: null,
          username: user.username,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // IP manzilni olish uchun request'ni olish kerak
      // Lekin bu yerda request mavjud emas, shuning uchun API route yaratamiz
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.username = (user as any).username
        token.name = (user as any).name
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
