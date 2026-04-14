/**
 * android-twa papkasida: bubblewrap update --skipVersionUpgrade
 */
const { spawnSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..', '..')
const dir = path.join(root, 'android-twa')
const manifest = path.join(dir, 'twa-manifest.json')

const fs = require('fs')
if (!fs.existsSync(manifest)) {
  console.error('Avval: npm run twa:sync-manifest')
  process.exit(1)
}

const r = spawnSync('npx', ['bubblewrap', 'update', '--skipVersionUpgrade'], {
  stdio: 'inherit',
  cwd: dir,
  shell: true,
  env: process.env,
})

process.exit(r.status === null ? 1 : r.status)
