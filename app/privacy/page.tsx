import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati | rash.uz',
  description:
    'rash.uz raqamli ta\'lim platformasi foydalanuvchi ma\'lumotlarini qanday yig\'ishi, saqlashi va himoya qilishi haqida.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm text-green-400 mb-2">rash.uz</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Maxfiylik siyosati</h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Umumiy qoidalar</h2>
            <p>
              Ushbu hujjat <strong className="text-gray-100">rash.uz</strong> platformasidan foydalanganingizda
              shaxsiy va xizmat ko&apos;rsatishga oid ma&apos;lumotlaringiz qanday ishlov berilishini
              tushuntiradi. Platformadan foydalanish ushbu siyosatga rozilik bildirganingizni anglatadi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Yig&apos;iladigan ma&apos;lumotlar</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>
                <span className="text-gray-100">Hisob ma&apos;lumotlari:</span> tizimga kirish uchun login,
                parol xeshi, ism va rol (masalan, o&apos;quvchi, o&apos;qituvchi, administrator).
              </li>
              <li>
                <span className="text-gray-100">Ta&apos;lim jarayoni:</span> davomat, test va vazifa
                natijalari, baholar, guruhlar va boshqa platformada ko&apos;rsatiladigan o&apos;quv
                ma&apos;lumotlari.
              </li>
              <li>
                <span className="text-gray-100">Texnik ma&apos;lumotlar:</span> brauzer/ilova turi, IP
                manzil, cookie va sessiya identifikatorlari — xavfsizlik va barqaror ishlash uchun.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Ma&apos;lumotlardan foydalanish</h2>
            <p>
              Ma&apos;lumotlar platformani ta&apos;minlash, hisobotlar, to&apos;lovlar va integratsiyalar
              (masalan, Telegram yoki tashqi xizmatlar, agar ular yoqilgan bo&apos;lsa) uchun ishlatiladi.
              Uchinchi shaxslarga sizning roziligingiz yoki qonuniy talab bo&apos;lmaguncha sotilmaydi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Saqlash va xavfsizlik</h2>
            <p>
              Ma&apos;lumotlar himoyalangan serverlarda saqlanadi; uzatish HTTPS orqali amalga oshiriladi.
              Parollar ochiq ko&apos;rinishda saqlanmaydi. Xavfsizlik choralari doimiy ravishda
              yangilanishi mumkin.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Cookie</h2>
            <p>
              Sayt va mobil ilova sessiyasi, tizimga kirish va afzalliklarni eslab qolish uchun cookie
              yoki shunga o&apos;xshash texnologiyalardan foydalanishi mumkin. Brauzer sozlamalaridan
              cookie&apos;larni cheklashingiz mumkin; bu ayrim funksiyalarning ishlashiga ta&apos;sir
              qilishi mumkin.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Huquqlaringiz</h2>
            <p>
              O&apos;z ma&apos;lumotlaringizga kirish, tuzatish yoki o&apos;chirishni so&apos;rashingiz
              mumkin — buning uchun platforma administratori yoki quyidagi aloqa orqali murojaat qiling.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. O&apos;zgarishlar</h2>
            <p>
              Siyosat yangilanishi mumkin. Yangi versiya ushbu sahifada e&apos;lon qilinadi; muhim
              o&apos;zgarishlar bo&apos;lsa, qo&apos;shimcha xabar berish chorasi ko&apos;riladi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Aloqa</h2>
            <p className="space-y-2">
              Savollar uchun:{' '}
              <a href="tel:+998770920606" className="text-green-400 hover:text-green-300">
                +998 77 092 06 06
              </a>
              , Telegram:{' '}
              <a
                href="https://t.me/nvstruz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300"
              >
                @nvstruz
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-12">
          <Link href="/" className="text-green-400 hover:text-green-300 text-sm font-medium">
            ← Bosh sahifaga
          </Link>
        </p>
      </div>
    </div>
  )
}
