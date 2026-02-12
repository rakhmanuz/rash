import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// rash.com.uz domeni - Head Admin (HQ) paneli uchun
function rashDomainMiddleware(req: Request, hasToken: boolean) {
  const url = new URL(req.url)
  const host = req.headers.get('host') || ''
  const isRashDomain = host.includes('rash.com.uz')
  const path = url.pathname

  if (!isRashDomain) return null

  // rash.com.uz/ -> /hq
  if (path === '/') {
    return NextResponse.redirect(new URL('/hq', req.url))
  }

  // rash.com.uz/login: login bo'lmagan user uchun ochiq, login bo'lgan user HQ ga o'tadi
  if (path === '/login' && hasToken) {
    return NextResponse.redirect(new URL('/hq', req.url))
  }

  // Qisqa route: /admins -> /hq/admins
  if (path === '/admins' || path.startsWith('/admins/')) {
    return NextResponse.redirect(new URL('/hq/admins', req.url))
  }

  // Legacy route'lar rash domenida HQ ga yo'naltiriladi
  if (path.startsWith('/rash') || path === '/payments' || path.startsWith('/payments/')) {
    return NextResponse.redirect(new URL('/hq', req.url))
  }

  return null
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token

    // rash.com.uz: avval rewrite
    const rashRewrite = rashDomainMiddleware(req, !!token)
    if (rashRewrite) return rashRewrite
    const path = req.nextUrl.pathname

    // /rash (login sahifa) - auth kerak emas
    if (path === '/rash' || path === '/rash/') {
      return NextResponse.next()
    }

    // HQ routes - faqat SUPER_ADMIN
    if (path.startsWith('/hq') || path.startsWith('/api/hq')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      const ownerFromEnv = (process.env.OWNER_USERNAME || process.env.SUPER_ADMIN_USERNAME || '').trim().toLowerCase()
      const isOwnerByUsername = ownerFromEnv && String(token.username || '').trim().toLowerCase() === ownerFromEnv
      const isSuperAdmin = token.role === 'SUPER_ADMIN' || isOwnerByUsername
      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

      // /rash/payments - ADMIN, MANAGER, ASSISTANT_ADMIN
    if (path.startsWith('/rash/')) {
      if (!token) {
        const host = req.headers.get('host') || ''
        const isRash = host.includes('rash.com.uz')
        return NextResponse.redirect(new URL(isRash ? '/' : '/login', req.url))
      }
      const rashAllowedRoles = ['ADMIN', 'MANAGER', 'ASSISTANT_ADMIN']
      if (!rashAllowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return NextResponse.next()
    }

    // Redirect based on role
    if (token) {
      // If accessing root dashboard, redirect to role-specific dashboard
      if (path === '/dashboard') {
        if (token.role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/hq', req.url))
        } else if (token.role === 'ADMIN' || token.role === 'MANAGER') {
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
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname
        const host = req.headers.get('host') || ''
        const isRash = host.includes('rash.com.uz')
        // rash.com.uz: / va /login -> /hq, login sahifa ochiq
        if (isRash && (path === '/' || path === '/login' || path === '/hq' || path === '/hq/')) return true
        // /rash (login) va /rash/payments - localhostda ham test qilish uchun
        if (path === '/rash' || path === '/rash/') return true
        if (path.startsWith('/rash/')) return true
        if (path.startsWith('/hq') || path.startsWith('/api/hq')) return !!token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/login',
    '/payments',
    '/payments/:path*',
    '/rash/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/assistant-admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/hq',
    '/hq/:path*',
    '/api/hq',
    '/api/hq/:path*',
  ],
}
