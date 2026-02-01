import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect based on role
    if (token) {
      // Role'ni to'g'ri formatlash - katta harf bilan
      const userRole = ((token.role as string) || 'STUDENT').toUpperCase()
      
      // If accessing root dashboard, redirect to role-specific dashboard
      if (path === '/dashboard') {
        if (userRole === 'ADMIN' || userRole === 'MANAGER') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (userRole === 'TEACHER') {
          return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
        } else {
          return NextResponse.redirect(new URL('/student/dashboard', req.url))
        }
      }

      // Protect admin routes - faqat ADMIN va MANAGER kirishi mumkin
      if (path.startsWith('/admin')) {
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
          // Agar STUDENT yoki TEACHER bo'lsa, o'z dashboard'iga yuborish
          if (userRole === 'TEACHER') {
            return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
          } else {
            return NextResponse.redirect(new URL('/student/dashboard', req.url))
          }
        }
      }

      // Protect teacher routes - faqat TEACHER kirishi mumkin
      if (path.startsWith('/teacher')) {
        if (userRole !== 'TEACHER') {
          if (userRole === 'ADMIN' || userRole === 'MANAGER') {
            return NextResponse.redirect(new URL('/admin/dashboard', req.url))
          } else {
            return NextResponse.redirect(new URL('/student/dashboard', req.url))
          }
        }
      }

      // Protect student routes - faqat STUDENT kirishi mumkin
      if (path.startsWith('/student')) {
        if (userRole !== 'STUDENT') {
          if (userRole === 'ADMIN' || userRole === 'MANAGER') {
            return NextResponse.redirect(new URL('/admin/dashboard', req.url))
          } else if (userRole === 'TEACHER') {
            return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
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
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
}
