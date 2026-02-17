'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRashComDomain, setIsRashComDomain] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname.toLowerCase()
      setIsRashComDomain(host === 'rash.com.uz' || host === 'www.rash.com.uz')
    }
  }, [])

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
            // Kirish tarixini yozish (admin hisobot uchun)
            fetch('/api/auth/log-login', { method: 'POST' }).catch(() => {})
            // Get user role and redirect accordingly
            const response = await fetch('/api/auth/user')
            if (response.ok) {
              const user = await response.json()
              // Redirect based on role
              if (user.role === 'ADMIN' || user.role === 'MANAGER') {
                if (isRashComDomain) {
                  window.location.href = 'https://rash.uz/admin/dashboard'
                } else {
                  router.push('/admin/dashboard')
                }
              } else if (user.role === 'ASSISTANT_ADMIN') {
                if (isRashComDomain) {
                  router.push('/assistant-admin/dashboard')
                } else {
                  window.location.href = 'https://rash.com.uz/assistant-admin/dashboard'
                }
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
  }, [searchParams, router, loading, isRashComDomain])

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
        // Kirish tarixini yozish (admin hisobot uchun)
        fetch('/api/auth/log-login', { method: 'POST' }).catch(() => {})
        // Get user role and redirect accordingly
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const user = await response.json()
          // Redirect based on role
          if (user.role === 'ADMIN' || user.role === 'MANAGER') {
            if (isRashComDomain) {
              window.location.href = 'https://rash.uz/admin/dashboard'
            } else {
              router.push('/admin/dashboard')
            }
          } else if (user.role === 'ASSISTANT_ADMIN') {
            if (isRashComDomain) {
              router.push('/assistant-admin/dashboard')
            } else {
              window.location.href = 'https://rash.com.uz/assistant-admin/dashboard'
            }
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

  const inputClass = isRashComDomain
    ? 'block w-full pl-11 pr-4 py-3 min-h-[48px] text-[14px] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-indigo-500/20 transition-all'
    : 'block w-full pl-11 pr-4 py-3 min-h-[48px] text-[14px] bg-slate-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 sm:py-12 px-3 sm:px-4 relative overflow-hidden w-full ${
      isRashComDomain ? 'bg-[var(--bg-primary)]' : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
    }`}>
      {isRashComDomain && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-indigo-500/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-500/6 blur-3xl" />
        </div>
      )}

      <div className="max-w-[400px] w-full relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
            {isRashComDomain ? 'RASH Assistant Panel' : 'Tizimga Kirish'}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {isRashComDomain ? 'Yordamchi adminlar uchun professional ish paneli' : 'Login va parol faqat admin tomonidan beriladi'}
          </p>
        </div>

        <form
          className={`space-y-5 p-6 sm:p-8 rounded-[var(--radius-xl)] border ${
            isRashComDomain
              ? 'assistant-glass assistant-elevated-shadow'
              : 'bg-slate-800/50 backdrop-blur-sm border-gray-700'
          }`}
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Foydalanuvchi nomi</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="Login kiriting"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Parolingizni kiriting"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-[46px] flex justify-center items-center gap-2 font-semibold rounded-[var(--radius-md)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isRashComDomain
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Kirish</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link href="/" className={`text-sm ${isRashComDomain ? 'text-[var(--text-muted)] hover:text-indigo-400' : 'text-gray-400 hover:text-green-400'} transition-colors`}>
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white">Yuklanmoqda...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
