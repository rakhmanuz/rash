import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Bizning jamoa bilan bog'laning
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Biznesingizni yangi darajaga ko'tarishga yordam beramiz. 
            Bepul konsultatsiya olish uchun biz bilan bog'laning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center px-8 py-4 text-base font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Mail className="mr-2 h-5 w-5" />
              Aloqa
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white border-2 border-white rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              Portfolio ko'rish
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
