import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { normalizeLearningMode } from '@/lib/learning-mode'
import { isRashComHost, isRashUzHost, resolveLandingByRole, studentDashboardForMode } from '@/lib/navigation-policy'

function getHost(req: any) {
  const forwardedHost = req.headers.get('x-forwarded-host')
  if (forwardedHost) return forwardedHost.split(',')[0].trim().toLowerCase()
  const hostHeader = req.headers.get('host')
  if (hostHeader) return hostHeader.split(':')[0].toLowerCase()
  return req.nextUrl.hostname?.toLowerCase() || ''
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const host = getHost(req)
    const onRashUz = isRashUzHost(host)
    const onRashCom = isRashComHost(host)

    if (onRashUz && path.startsWith('/assistant-admin')) {
      if (token?.role === 'RAHBAR') {
        return NextResponse.redirect(new URL('/rahbar/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('https://rash.com.uz/login', req.url))
    }

    if (onRashCom && path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('https://rash.uz/admin/dashboard', req.url))
    }


    // Redirect based on role
    if (token) {
      const learningMode = normalizeLearningMode((token as any).learningMode)
      const studentDashboard = studentDashboardForMode(learningMode)

      if (onRashCom && token.role !== 'ASSISTANT_ADMIN') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('https://rash.uz/admin/dashboard', req.url))
        }
        if (token.role === 'RAHBAR') {
          return NextResponse.redirect(new URL('https://rash.uz/rahbar/dashboard', req.url))
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }

      if (onRashUz && token.role === 'ASSISTANT_ADMIN') {
        return NextResponse.redirect(new URL('https://rash.com.uz/assistant-admin/dashboard', req.url))
      }

      // If accessing root dashboard, redirect to role-specific dashboard
      if (path === '/dashboard') {
        const landing = resolveLandingByRole({ role: token.role as string | undefined, learningMode })
        return NextResponse.redirect(new URL(landing.path, req.url))
      }

      // Protect admin routes
      if (path.startsWith('/admin') && token.role !== 'ADMIN' && token.role !== 'MANAGER') {
        if (token.role === 'RAHBAR') {
          return NextResponse.redirect(new URL('/rahbar/dashboard', req.url))
        }
        return NextResponse.redirect(new URL(studentDashboard, req.url))
      }

      // Rahbar panel — faqat RAHBAR roli
      if (path.startsWith('/rahbar') && token.role !== 'RAHBAR') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        }
        if (token.role === 'ASSISTANT_ADMIN') {
          return NextResponse.redirect(new URL('https://rash.com.uz/assistant-admin/dashboard', req.url))
        }
        if (token.role === 'TEACHER') {
          return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
        }
        return NextResponse.redirect(new URL(studentDashboard, req.url))
      }

      // Protect assistant admin routes
      if (path.startsWith('/assistant-admin') && token.role !== 'ASSISTANT_ADMIN') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (token.role === 'TEACHER') {
          return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
        } else if (token.role === 'RAHBAR') {
          return NextResponse.redirect(new URL('/rahbar/dashboard', req.url))
        } else {
          return NextResponse.redirect(new URL(studentDashboard, req.url))
        }
      }

      // Protect teacher routes
      if (path.startsWith('/teacher') && token.role !== 'TEACHER') {
        if (token.role === 'ADMIN' || token.role === 'MANAGER') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (token.role === 'ASSISTANT_ADMIN') {
          return NextResponse.redirect(new URL('/assistant-admin/dashboard', req.url))
        } else if (token.role === 'RAHBAR') {
          return NextResponse.redirect(new URL('/rahbar/dashboard', req.url))
        } else {
          return NextResponse.redirect(new URL('/student/dashboard', req.url))
        }
      }

      // Protect student routes
      if (
        path.startsWith('/student') &&
        (token.role === 'ADMIN' ||
          token.role === 'MANAGER' ||
          token.role === 'ASSISTANT_ADMIN' ||
          token.role === 'RAHBAR')
      ) {
        if (token.role === 'ASSISTANT_ADMIN') {
          return NextResponse.redirect(new URL('/assistant-admin/dashboard', req.url))
        }
        if (token.role === 'RAHBAR') {
          return NextResponse.redirect(new URL('/rahbar/dashboard', req.url))
        }
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }

      if (token.role === 'STUDENT' && path.startsWith('/student/')) {
        const nextPath = path.replace('/student', learningMode === 'ONLINE' ? '/student-online' : '/student-offline')
        return NextResponse.redirect(new URL(nextPath, req.url))
      }

      if (token.role === 'STUDENT' && path.startsWith('/student-online') && learningMode !== 'ONLINE') {
        return NextResponse.redirect(new URL(studentDashboard, req.url))
      }
      if (token.role === 'STUDENT' && path.startsWith('/student-offline') && learningMode !== 'OFFLINE') {
        return NextResponse.redirect(new URL(studentDashboard, req.url))
      }
      if (
        (path.startsWith('/student-online') || path.startsWith('/student-offline')) &&
        token.role !== 'STUDENT'
      ) {
        const landing = resolveLandingByRole({
          role: token.role as string | undefined,
          learningMode,
        })
        return NextResponse.redirect(new URL(landing.path, req.url))
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
    '/dashboard/:path*',
    '/admin/:path*',
    '/assistant-admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/student-online/:path*',
    '/student-offline/:path*',
    '/rahbar/:path*',
  ],
}
