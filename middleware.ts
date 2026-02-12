import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname


    // Redirect based on role
    if (token) {
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
