import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-400 px-6 py-3 rounded-full mb-8">
            <Lock className="h-5 w-5" />
            <span className="text-sm font-semibold">Xavfsiz kirish - Faqat admin tomonidan beriladi</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Tizimga Kirish
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Login va parollar faqat admin tomonidan beriladi. 
            Bu xavfsizlik va tartibni maksimal darajada ta'minlaydi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 hover:scale-105"
            >
              Tizimga kirish
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-400">
            Agar sizda login va parol bo'lmasa, admin bilan bog'laning
          </p>
        </div>
      </div>
    </section>
  )
}
