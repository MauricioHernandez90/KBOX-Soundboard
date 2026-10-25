import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const base = path.join(root, 'public', 'sonidos-default')
const out = path.join(root, 'public', 'sonidos-index.json')
const SUPPORTED = ['mp3', 'wav', 'ogg', 'mp4', 'm4a', 'flac', 'webm', 'aac']

const entries = []

function walk(dir, parts) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue // .trash y ocultos
    if (e.isDirectory()) {
      walk(path.join(dir, e.name), [...parts, e.name])
    } else if (SUPPORTED.includes(e.name.split('.').pop().toLowerCase())) {
      entries.push({
        category: parts[parts.length - 1] || 'GENERAL',
        file: e.name,
        path: '/sonidos-default/' + [...parts, e.name].join('/')
      })
    }
  }
}

if (fs.existsSync(base)) walk(base, [])
else console.warn('[generate-index] No existe', base)

entries.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
fs.writeFileSync(out, JSON.stringify(entries, null, 2))
console.log(`[generate-index] ${entries.length} sonidos -> ${out}`)
