/**
 * android-twa papkasida: bubblewrap build
 * (BUBBLEWRAP_KEYSTORE_PASSWORD / BUBBLEWRAP_KEY_PASSWORD muhitda — CI uchun)
 */
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..', '..')
const dir = path.join(root, 'android-twa')
const manifest = path.join(dir, 'twa-manifest.json')

if (!fs.existsSync(manifest)) {
  console.error('Avval: npm run twa:sync-manifest && npm run twa:update')
  process.exit(1)
}

const extra = process.argv.slice(2)
const r = spawnSync('npx', ['bubblewrap', 'build', ...extra], {
  stdio: 'inherit',
  cwd: dir,
  shell: true,
  env: process.env,
})

process.exit(r.status === null ? 1 : r.status)
