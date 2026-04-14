/**
 * Keystore + local.properties → cap sync → bundleRelease → mobile-app/output/rash-play-release.aab
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
r = spawnSync(gradlew, ['bundleRelease', '--no-daemon'], {
  stdio: 'inherit',
  cwd: android,
  shell: process.platform === 'win32',
})
exitFrom(r.status)

const src = path.join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
if (!fs.existsSync(src)) {
  console.error('AAB topilmadi:', src)
  process.exit(1)
}
const outDir = path.join(root, 'mobile-app', 'output')
fs.mkdirSync(outDir, { recursive: true })
const dest = path.join(outDir, 'rash-play-release.aab')
fs.copyFileSync(src, dest)
console.log('')
console.log('=== TAYYOR AAB ===')
console.log(dest)
console.log('Parol va kalit: mobile-app/PLAY_SIGNING_BACKUP.txt')
console.log('')
