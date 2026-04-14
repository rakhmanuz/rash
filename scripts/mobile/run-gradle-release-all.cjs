/**
 * Bir martada: AAB + APK (prepare va sync bir marta, Gradle ikkala task).
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', '..')
const android = path.join(root, 'mobile-app', 'android')
const prepare = path.join(root, 'scripts', 'mobile', 'prepare-play-release.cjs')

function exitFrom(code) {
  if (code !== 0 && code !== null) process.exit(code)
  if (code === null) process.exit(1)
}

let r = spawnSync(process.execPath, [prepare], { stdio: 'inherit', cwd: root, shell: false })
exitFrom(r.status)

r = spawnSync('npm', ['run', 'mobile:sync'], { stdio: 'inherit', cwd: root, shell: true })
exitFrom(r.status)

const gradlew = path.join(android, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')
r = spawnSync(gradlew, ['bundleRelease', 'assembleRelease', '--no-daemon'], {
  stdio: 'inherit',
  cwd: android,
  shell: process.platform === 'win32',
})
exitFrom(r.status)

const outDir = path.join(root, 'mobile-app', 'output')
fs.mkdirSync(outDir, { recursive: true })

const aabSrc = path.join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
const apkSrc = path.join(android, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')

if (!fs.existsSync(aabSrc)) {
  console.error('AAB topilmadi:', aabSrc)
  process.exit(1)
}
if (!fs.existsSync(apkSrc)) {
  console.error('APK topilmadi:', apkSrc)
  process.exit(1)
}

const aabDest = path.join(outDir, 'rash-play-release.aab')
const apkDest = path.join(outDir, 'rash-play-release.apk')
fs.copyFileSync(aabSrc, aabDest)
fs.copyFileSync(apkSrc, apkDest)

console.log('')
console.log('=== TAYYOR ===')
console.log(aabDest)
console.log(apkDest)
console.log('Parol va kalit: mobile-app/PLAY_SIGNING_BACKUP.txt')
console.log('')
