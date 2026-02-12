import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const RASH_UZ_HOSTS = new Set(['rash.uz', 'www.rash.uz'])
const RASH_COM_HOSTS = new Set(['rash.com.uz', 'www.rash.com.uz'])

function getHost(req: any) {
  const forwardedHost = req.headers.get('x-forwarded-host')
  if (forwardedHost) return forwardedHost.split(',')[0].trim().toLowerCase()
  const hostHeader = req.headers.get('host')
  if (hostHeader) return hostHeader.split(':')[0].toLowerCase()
  return req.nextUrl.hostname?.toLowerCase() || ''
}

function isRashUzHost(host: string) {
  return RASH_UZ_HOSTS.has(host)
}

function isRashComHost(host: string) {
  return RASH_COM_HOSTS.has(host)
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const host = getHost(req)
    const onRashUz = isRashUzHost(host)
    const onRashCom = isRashComHost(host)

    if (onRashUz && path.startsWith('/assistant-admin')) {
      return NextResponse.redirect(new URL('https://rash.com.uz/login', req.url))
    }

    if (onRashCom && path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('https://rash.uz/admin/dashboard', req.url))
    }


    // Redirect based on role
    if (token) {
      if (onRashCom && token.role !== 'ASSISTANT_ADMIN') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('https://rash.uz/admin/dashboard', req.url))
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }

      if (onRashUz && token.role === 'ASSISTANT_ADMIN') {
        return NextResponse.redirect(new URL('https://rash.com.uz/assistant-admin/dashboard', req.url))
      }

      // If accessing root dashboard, redirect to role-specific dashboard
      if (path === '/dashboard') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (token.role === 'ASSISTANT_ADMIN') {
          return NextResponse.redirect(new URL('/assistant-admin/dashboard', req.url))
        } else if (token.role === 'TEACHER') {
          return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
        } else {
          return NextResponse.redirect(new URL('/student/dashboard', req.url))
        }
      }

      // Protect admin routes
      if (path.startsWith('/admin') && token.role !== 'ADMIN' && token.role !== 'MANAGER') {
        return NextResponse.redirect(new URL('/student/dashboard', req.url))
      }

      // Protect assistant admin routes
      if (path.startsWith('/assistant-admin') && token.role !== 'ASSISTANT_ADMIN') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (token.role === 'TEACHER') {
          return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
        } else {
          return NextResponse.redirect(new URL('/student/dashboard', req.url))
        }
      }

      // Protect teacher routes
      if (path.startsWith('/teacher') && token.role !== 'TEACHER') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (token.role === 'ASSISTANT_ADMIN') {
          return NextResponse.redirect(new URL('/assistant-admin/dashboard', req.url))
        } else {
          return NextResponse.redirect(new URL('/student/dashboard', req.url))
        }
      }

      // Protect student routes
      if (path.startsWith('/student') && (token.role === 'ADMIN' || token.role === 'MANAGER' || token.role === 'ASSISTANT_ADMIN')) {
        if (token.role === 'ASSISTANT_ADMIN') {
          return NextResponse.redirect(new URL('/assistant-admin/dashboard', req.url))
        } else {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        }
      }

      if (path.startsWith('/assistant-admin') && token.role === 'ASSISTANT_ADMIN') {
        const permissions = ((token as any).permissions || {}) as Record<string, any>
        const sectionRules: Array<{ prefix: string; permissionKey?: string }> = [
          { prefix: '/assistant-admin/dashboard' },
          { prefix: '/assistant-admin/profile' },
          { prefix: '/assistant-admin/payments', permissionKey: 'payments' },
          { prefix: '/assistant-admin/students', permissionKey: 'students' },
          { prefix: '/assistant-admin/reports', permissionKey: 'reports' },
          { prefix: '/assistant-admin/schedules', permissionKey: 'schedules' },
          { prefix: '/assistant-admin/tests', permissionKey: 'tests' },
          { prefix: '/assistant-admin/groups', permissionKey: 'groups' },
          { prefix: '/assistant-admin/teachers', permissionKey: 'teachers' },
          { prefix: '/assistant-admin/market', permissionKey: 'market' },
        ]

        const matchedRule = sectionRules.find((rule) => path.startsWith(rule.prefix))

        // Assistant admin uchun noma'lum bo'limlar default yopiq
        if (!matchedRule) {
          return NextResponse.redirect(new URL('/assistant-admin/dashboard', req.url))
        }

        if (matchedRule.permissionKey) {
          const hasView = Boolean(permissions?.[matchedRule.permissionKey]?.view)
          if (!hasView) {
            return NextResponse.redirect(new URL('/assistant-admin/dashboard', req.url))
          }
        }
      }
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ req, token }) => {
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/admin/:path*',
    '/assistant-admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
}
