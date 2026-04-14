/**
 * Lokal mashinada ~/.bubblewrap/config.json — JDK va Android SDK yo‘llari.
 * JAVA_HOME va ANDROID_SDK_ROOT (yoki ANDROID_HOME) bo‘lishi kerak.
 */
const fs = require('fs')
const path = require('path')
const os = require('os')

const jdkPath = process.env.JAVA_HOME
const androidSdkPath = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME

if (!jdkPath || !androidSdkPath) {
  console.error('JAVA_HOME va ANDROID_SDK_ROOT (yoki ANDROID_HOME) muhit o‘zgaruvchilarini o‘rnating.')
  process.exit(1)
}

const dir = path.join(os.homedir(), '.bubblewrap')
const file = path.join(dir, 'config.json')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(file, JSON.stringify({ jdkPath, androidSdkPath }, null, 2) + '\n')
console.log('Yozildi:', file)
