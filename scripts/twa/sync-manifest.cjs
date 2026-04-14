/**
 * public/manifest.json asosida android-twa/twa-manifest.json yaratadi
 * (Bubblewrap @bubblewrap/core — veb manifest bilan mos).
 *
 * ANDROID_TWA_PACKAGE_NAME muhit o‘zgaruvchisi bo‘lmasa: uz.rash.app
 */
const fs = require('fs')
const path = require('path')
const { TwaManifest } = require('@bubblewrap/core')

const root = path.join(__dirname, '..', '..')
const webPath = path.join(root, 'public', 'manifest.json')
const outDir = path.join(root, 'android-twa')
const outFile = path.join(outDir, 'twa-manifest.json')

const webManifestUrl = new URL(
  process.env.TWA_WEB_MANIFEST_URL || 'https://rash.uz/manifest.json'
)

const raw = fs.readFileSync(webPath, 'utf8')
const webManifest = JSON.parse(raw)

const twa = TwaManifest.fromWebManifestJson(webManifestUrl, webManifest)

const packageId = (process.env.ANDROID_TWA_PACKAGE_NAME || 'uz.rash.app').trim()
twa.packageId = packageId
twa.enableNotifications = process.env.TWA_ENABLE_NOTIFICATIONS === '1'
twa.generatorApp = 'bubblewrap-cli'

fs.mkdirSync(outDir, { recursive: true })

async function main() {
  await twa.saveToFile(outFile)
  console.log('Yozildi:', outFile)
  console.log('packageId:', packageId)
  console.log('Keyingi qadam: GitHub Actions "TWA Android build" yoki lokalda npm run twa:update')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
