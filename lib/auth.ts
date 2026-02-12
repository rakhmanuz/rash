import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendTelegramNotification } from '@/lib/telegram'
import { NextRequest } from 'next/server'

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
          throw new Error('Login va parol kiriting')
        }

        const user = await prisma.user.findUnique({
          where: { username: normalizedUsername },
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
          incomingPassword,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        // Domen/rejim bo'yicha qat'iy xavfsizlik:
        // - payment rejimida (rash-payment) faqat ASSISTANT_ADMIN kira oladi
        // - oddiy rejimda ASSISTANT_ADMIN faqat rash.com.uz/local orqali kira oladi
        const isPaymentMode = process.env.RASH_MODE === 'payment'
        const host = (req as any)?.headers?.get?.('host') || (req as any)?.headers?.get?.('x-forwarded-host') || ''
        const isRashComDomain = host.includes('rash.com.uz')
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

        // rash-payment process: faqat assistant admin
        if (isPaymentMode && user.role !== 'ASSISTANT_ADMIN') {
          throw new Error('Login yoki parol noto\'g\'ri')
        }

        // oddiy processda assistant admin rash.com.uz/local orqali kiradi
        if (!isPaymentMode && user.role === 'ASSISTANT_ADMIN' && !isRashComDomain && !isLocalhost) {
          throw new Error('Login yoki parol noto\'g\'ri')
        }

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
