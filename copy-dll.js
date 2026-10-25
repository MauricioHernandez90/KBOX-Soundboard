import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const releaseDir = path.join(root, 'src-tauri', 'target', 'x86_64-pc-windows-gnu', 'release')
const dest = path.join(root, 'src-tauri', 'WebView2Loader.dll')
const NAME = 'WebView2Loader.dll'

function find(dir, depth = 0) {
  if (!fs.existsSync(dir)) return null
  const direct = path.join(dir, NAME)
  if (fs.existsSync(direct)) return direct
  if (depth > 5) return null
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    const found = find(path.join(dir, e.name), depth + 1)
    if (found) return found
  }
  return null
}

// Prioriza la raíz de release; si no, busca en build/** (preferiendo x64)
let src = fs.existsSync(path.join(releaseDir, NAME)) ? path.join(releaseDir, NAME) : null
if (!src) src = find(path.join(releaseDir, 'build', ''), 0)

if (!src) {
  console.warn(`[copy-dll] No se encontró ${NAME} en ${releaseDir}`)
  process.exit(fs.existsSync(dest) ? 0 : 1)
}

fs.copyFileSync(src, dest)
console.log(`[copy-dll] ${src} -> ${dest}`)
