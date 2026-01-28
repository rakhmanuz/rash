'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // URL'dan query parametrlarini o'qish va avtomatik to'ldirish
  useEffect(() => {
    const urlUsername = searchParams.get('username')
    const urlPassword = searchParams.get('password')
    
    if (urlUsername) {
      setUsername(urlUsername)
    }
    if (urlPassword) {
      setPassword(urlPassword)
    }
    
    // Agar ikkalasi ham bo'lsa, avtomatik login qilish
    if (urlUsername && urlPassword && !loading) {
      // Kichik kechikish - state yangilanishi uchun
      const timer = setTimeout(async () => {
        setError('')
        setLoading(true)

        try {
          const result = await signIn('credentials', {
            username: urlUsername,
            password: urlPassword,
            redirect: false,
          })

          if (result?.error) {
            // Check if error message contains our custom message
            if (result.error.includes('uzulgansiz') || result.error === 'Siz tizimdan uzulgansiz') {
              setError('Siz tizimdan uzulgansiz')
            } else {
              setError('Login yoki parol noto\'g\'ri')
            }
            setLoading(false)
          } else if (result?.ok) {
            // Get user role and redirect accordingly
            const response = await fetch('/api/auth/user')
            if (response.ok) {
              const user = await response.json()
              // Redirect based on role
              if (user.role === 'ADMIN' || user.role === 'MANAGER') {
                router.push('/admin/dashboard')
              } else if (user.role === 'TEACHER') {
                router.push('/teacher/dashboard')
              } else {
                router.push('/student/dashboard')
              }
              router.refresh()
            } else {
              router.push('/student/dashboard')
              router.refresh()
            }
          }
        } catch (error) {
          setError('Xatolik yuz berdi')
          setLoading(false)
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [searchParams, router, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Check if error message contains our custom message
        if (result.error.includes('uzulgansiz') || result.error === 'Siz tizimdan uzulgansiz') {
          setError('Siz tizimdan uzulgansiz')
        } else {
          setError('Login yoki parol noto\'g\'ri')
        }
      } else if (result?.ok) {
        // Get user role and redirect accordingly
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const user = await response.json()
          // Redirect based on role
          if (user.role === 'ADMIN' || user.role === 'MANAGER') {
            router.push('/admin/dashboard')
          } else if (user.role === 'TEACHER') {
            router.push('/teacher/dashboard')
          } else {
            router.push('/student/dashboard')
          }
          router.refresh()
        } else {
          router.push('/student/dashboard')
          router.refresh()
        }
      }
    } catch (error) {
      setError('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="text-3xl font-black">
              <span className="text-white">RASH</span>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">
            Tizimga Kirish
          </h2>
          <p className="text-gray-400">
            Login va parol faqat admin tomonidan beriladi
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-slate-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Login
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg placeholder-gray-500 bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Login kiriting"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg placeholder-gray-500 bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Parolingizni kiriting"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-green-500/50"
            >
              {loading ? (
                'Kutilmoqda...'
              ) : (
                <>
                  Kirish
                  <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
