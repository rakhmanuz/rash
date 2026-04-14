/**
 * Play upload uchun keystore + keystore.properties + local.properties.
 * Parollar: mobile-app/PLAY_SIGNING_BACKUP.txt (gitignore).
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

const androidRoot = path.join(__dirname, '..', '..', 'mobile-app', 'android')
const ksName = 'rash-upload.jks'
const ksPath = path.join(androidRoot, ksName)
const propsPath = path.join(androidRoot, 'keystore.properties')
const localProps = path.join(androidRoot, 'local.properties')
const backupPath = path.join(__dirname, '..', '..', 'mobile-app', 'PLAY_SIGNING_BACKUP.txt')
const alias = 'upload'

function findSdk() {
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) return process.env.ANDROID_HOME
  if (process.env.ANDROID_SDK_ROOT && fs.existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT
  }
  const win = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')
  if (fs.existsSync(win)) return win
  const mac = path.join(os.homedir(), 'Library', 'Android', 'sdk')
  if (fs.existsSync(mac)) return mac
  return null
}

function findKeytool() {
  const jh = process.env.JAVA_HOME
  if (jh) {
    const kt = path.join(jh, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool')
    if (fs.existsSync(kt)) return kt
  }
  const r = spawnSync('where', ['keytool'], { shell: true, encoding: 'utf8' })
  if (r.status === 0 && r.stdout) return r.stdout.trim().split(/\r?\n/)[0]
  return 'keytool'
}

const sdk = findSdk()
if (!sdk) {
  console.error('Android SDK topilmadi. ANDROID_HOME yoki Android Studio SDK kerak.')
  process.exit(1)
}

fs.mkdirSync(androidRoot, { recursive: true })
fs.writeFileSync(localProps, `sdk.dir=${sdk.replace(/\\/g, '/')}\n`, 'utf8')
console.log('Yozildi:', localProps)

let storePassword
let keyPassword

if (fs.existsSync(ksPath)) {
  if (!fs.existsSync(propsPath)) {
    console.error('rash-upload.jks bor, lekin keystore.properties yo‘q. Tiklash yoki .jks ni o‘chirib qayta ishga tushiring.')
    process.exit(1)
  }
  const raw = fs.readFileSync(propsPath, 'utf8')
  const sp = /^storePassword=(.*)$/m.exec(raw)
  const kp = /^keyPassword=(.*)$/m.exec(raw)
  if (!sp || !kp) {
    console.error('keystore.properties noto‘g‘ri.')
    process.exit(1)
  }
  storePassword = sp[1].trim()
  keyPassword = kp[1].trim()
  console.log('Mavjud keystore ishlatiladi:', ksPath)
} else {
  storePassword = crypto.randomBytes(12).toString('base64url')
  keyPassword = storePassword
  const keytool = findKeytool()
  const dname = 'CN=rash.uz Play upload, OU=Mobile, O=rash, L=Tashkent, ST=Tashkent, C=UZ'
  const args = [
    '-genkeypair',
    '-v',
    '-storetype',
    'PKCS12',
    '-keystore',
    ksPath,
    '-alias',
    alias,
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    storePassword,
    '-keypass',
    keyPassword,
    '-dname',
    dname,
  ]
  const r = spawnSync(keytool, args, { stdio: 'inherit' })
  if (r.status !== 0) {
    console.error('keytool xato. JAVA_HOME ni tekshiring.')
    process.exit(1)
  }
  console.log('Yaratildi:', ksPath)
}

const props =
  `storePassword=${storePassword}\n` +
  `keyPassword=${keyPassword}\n` +
  `keyAlias=${alias}\n` +
  `storeFile=${ksName}\n`
fs.writeFileSync(propsPath, props, 'utf8')
console.log('Yozildi:', propsPath)

const backup =
  '=== rash.uz — Play upload kaliti (maxfiy) ===\n' +
  `Fayl: mobile-app/android/${ksName}\n` +
  `Alias: ${alias}\n` +
  `storePassword: ${storePassword}\n` +
  `keyPassword: ${keyPassword}\n\n` +
  'Bu matn va .jks faylni xavfsiz saqlang. Keyingi AAB lar shu kalit bilan imzolanadi.\n'
fs.writeFileSync(backupPath, backup, 'utf8')
console.log('SAQLANG:', backupPath)
