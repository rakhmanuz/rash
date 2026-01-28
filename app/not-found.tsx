'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'
import MatrixBackground from '@/components/MatrixBackground'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Matrix Background */}
      <MatrixBackground />
      
      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            404
          </h1>
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
          Sahifa topilmadi
        </h2>
        
        <div className="mb-8">
          <p className="text-2xl text-green-400 font-semibold mb-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">
            Tez kunda
          </p>
          <p className="text-xl text-gray-300 max-w-md mx-auto">
            Bu sahifa hozircha mavjud emas. Tez orada qo&apos;shiladi.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-semibold shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] transform hover:scale-105"
          >
            <Home className="h-5 w-5" />
            Bosh sahifaga
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg transition-all font-semibold border border-green-500/30 hover:border-green-500/50 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
            Orqaga
          </button>
        </div>
      </div>
    </div>
  )
}
