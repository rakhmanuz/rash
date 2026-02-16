import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 border-t border-gray-800 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Brand */}
          <div>
            <p className="text-sm sm:text-base text-gray-400 mb-4 break-words leading-relaxed">
              Professional o&apos;quv markazi boshqaruv platformasi. 
              To&apos;liq avtomatlashtirilgan raqamli ekotizim.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">Tezkor havolalar</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="block py-2 text-sm sm:text-base text-gray-400 hover:text-green-400 transition-colors min-h-[44px] flex items-center"
                >
                  Bosh sahifa
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="block py-2 text-sm sm:text-base text-gray-400 hover:text-green-400 transition-colors min-h-[44px] flex items-center"
                >
                  Tizimga kirish
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">Aloqa</h3>
            <ul className="space-y-3 text-sm sm:text-base text-gray-400">
              <li>
                <a 
                  href="tel:+998770920606" 
                  className="block py-2 hover:text-green-400 transition-colors min-h-[44px] flex items-center break-all"
                >
                  +998 77 092 06 06
                </a>
              </li>
              <li>
                <a 
                  href="https://t.me/nvstruz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block py-2 hover:text-green-400 transition-colors min-h-[44px] flex items-center break-all"
                >
                  Telegram: @nvstruz
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800">
          <p className="text-center text-sm sm:text-base text-gray-400">
            © {currentYear}. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </footer>
  )
}
