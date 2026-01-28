import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 border-t border-gray-800 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-black">
                <span className="text-white">RASH</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Professional o'quv markazi boshqaruv platformasi. 
              To'liq avtomatlashtirilgan raqamli ekotizim.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Tezkor havolalar</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                >
                  Bosh sahifa
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                >
                  Tizimga kirish
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Aloqa</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: info@rash.uz</li>
              <li>Telefon: +998 90 123 45 67</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-sm text-gray-400">
            © {currentYear} RASH. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </footer>
  )
}
