/**
 * GitHub Actions uchun: android.keystore faylini base64 qilib chiqaradi
 * (TWA_ANDROID_KEYSTORE_BASE64 secret qiymati).
 *
 * Foydalanish: node scripts/twa/print-keystore-secret.cjs path/to/android.keystore
 */
const fs = require('fs')

const p = process.argv[2]
if (!p) {
  console.error('Foydalanish: node scripts/twa/print-keystore-secret.cjs <android.keystore>')
  process.exit(1)
}
if (!fs.existsSync(p)) {
  console.error('Fayl topilmadi:', p)
  process.exit(1)
}

const b64 = fs.readFileSync(p).toString('base64')
console.log('')
console.log('GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret')
console.log('  Name:  TWA_ANDROID_KEYSTORE_BASE64')
console.log('  Value: quyidagi BIR QATOR (butunini nusxa oling):')
console.log('')
console.log(b64)
console.log('')
console.log('Bundan tashqari (yangi secretlar):')
console.log('  TWA_KEYSTORE_PASSWORD  — keystore paroli')
console.log('  TWA_KEY_PASSWORD       — kalit paroli (odatda xuddi shu)')
console.log('')
console.log('Eslatma: twa-manifest.json da alias "android", fayl nomi android.keystore bo‘lishi kerak.')
