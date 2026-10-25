<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
    <header class="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-zinc-800">
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
        <img src="/kbox-icon.png" alt="KBOX Logo" class="h-8 md:h-10 w-auto object-contain" />
        <div class="flex rounded-full bg-zinc-900 border border-zinc-800 p-1 text-xs font-black tracking-wider">
          <button @click="viewMode = 'library'" :class="['px-4 py-1.5 rounded-full transition', viewMode === 'library' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white']">BIBLIOTECA</button>
          <button @click="viewMode = 'workspace'" :class="['px-4 py-1.5 rounded-full transition', viewMode === 'workspace' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white']">MESAS DE TRABAJO</button>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div v-if="viewMode === 'library'" class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input v-model="search" placeholder="Buscar sonido o categoría..."
              class="w-64 rounded-full bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-sm outline-none focus:border-lime-400 placeholder:text-zinc-600" />
          </div>
          <label class="flex items-center gap-2 text-xs text-zinc-400 font-bold tracking-wider">
            VOL {{ Math.round(masterVol * 100) }}%
            <input type="range" min="0" max="1" step="0.01" v-model.number="masterVol" class="w-28 accent-lime-400" />
          </label>
          <button @click="stopAll" class="rounded-full bg-red-600 hover:bg-red-500 active:scale-95 px-5 py-2 text-sm font-black tracking-wider shadow-lg shadow-red-600/40 transition">
            PANIC [ESC]
          </button>
          <button v-if="isTauri || isCapacitor" @click="isCapacitor ? loadFromCapacitor() : loadFromTauri()" class="rounded-full bg-white text-black hover:bg-zinc-200 px-5 py-2 text-sm font-black tracking-wider cursor-pointer transition">
            CARGAR CARPETA RAIZ
          </button>
          <label v-else class="rounded-full bg-white text-black hover:bg-zinc-200 px-5 py-2 text-sm font-black tracking-wider cursor-pointer transition">
            CARGAR CARPETA RAIZ
            <input type="file" webkitdirectory directory multiple @change="onFolderPicked" class="hidden" />
          </label>
        </div>
      </div>
    </header>

    <div class="flex flex-col md:flex-row flex-1 min-h-0">
    <aside v-if="viewMode === 'library'" class="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 p-3 md:overflow-y-auto md:sticky md:top-[73px] md:h-[calc(100vh-73px)]">
      <p class="text-[11px] tracking-[0.2em] text-zinc-500 font-bold mb-3">BIBLIOTECA / SUBCARPETAS</p>
      <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
        <button @click="activeCat = ''"
          :class="['shrink-0 md:w-full flex justify-between items-center gap-3 text-left px-3 py-2.5 rounded-lg border text-xs font-bold tracking-wider uppercase transition', activeCat === '' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800']">
          <span>TODAS</span><span class="opacity-60">{{ totalSounds }}</span>
        </button>
        <button v-for="cat in combinedLibrary" :key="cat.name" @click="activeCat = activeCat === cat.name ? '' : cat.name"
          :class="['shrink-0 md:w-full flex justify-between items-center gap-3 text-left px-3 py-2.5 rounded-lg border text-xs font-bold tracking-wider uppercase transition', activeCat === cat.name ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800']">
          <span class="truncate">{{ cat.name }}</span><span class="opacity-60">{{ cat.sounds.length }}</span>
        </button>
      </div>
      <p v-if="!combinedLibrary.length" class="text-zinc-600 text-xs mt-3">
        Carga una carpeta raíz que contenga subfolders (ej. 21-FUNNY/archivo.mp3). Cada subfolder será una categoría.
      </p>
    </aside>

    <div v-if="debugError" class="mx-6 mt-3 rounded bg-red-950 border border-red-700 text-red-200 text-xs font-mono p-3 break-all select-text" @click="debugError = ''">{{ debugError }}</div>
    <main v-if="viewMode === 'workspace'" class="flex-1 min-w-0 p-4 md:p-6">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <select v-model="activeWorkspaceId" :disabled="!workspaces.length"
          style="color-scheme: dark;"
          class="bg-zinc-950 border border-lime-400 text-lime-400 font-bold rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-zinc-900">
          <option v-for="w in workspaces" :key="w.id" :value="w.id" class="bg-zinc-900 text-white">{{ w.name }}</option>
        </select>
        <button @click="createWorkspace" class="rounded-full bg-lime-400 hover:bg-lime-300 text-black px-4 py-2 text-xs font-black tracking-wider transition">CREAR MESA</button>
        <button @click="deleteWorkspace" :disabled="!activeWorkspace" class="rounded-full bg-zinc-900 border border-red-700 text-red-400 hover:bg-red-950 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2 text-xs font-black tracking-wider transition">BORRAR MESA</button>
      </div>
      <div v-if="!activeWorkspace" class="py-24 text-center text-zinc-600">
        <p class="text-5xl mb-3">🗂️</p>
        <p class="text-sm">Aún no tienes mesas de trabajo.</p>
        <p class="text-xs mt-1">Pulsa «CREAR MESA» para empezar (ej. Boda, Conferencia).</p>
      </div>
      <div v-else class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mx-auto">
        <div v-for="slot in activeWorkspace.slots" :key="slot.id" role="button" tabindex="-1"
          @click="slotSounds[slot.id] && playSound(slotSounds[slot.id])" @contextmenu.prevent="clearSlot(slot)"
          :class="['group relative select-none cursor-pointer rounded-xl border p-4 min-h-[140px] flex flex-col items-center justify-center gap-1 text-center transition active:scale-[0.97]',
            slotSounds[slot.id]?.playing
              ? 'bg-lime-400 text-black border-lime-300 shadow-[0_0_20px_rgba(163,230,53,0.5)]'
              : slotSounds[slot.id] ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800' : 'bg-zinc-950 border-dashed border-zinc-800 text-zinc-600']">
          <button @click.stop="listeningSlotId = listeningSlotId === slot.id ? null : slot.id" @contextmenu.stop.prevent tabindex="-1"
            :class="['absolute top-2 left-2 min-w-[28px] px-2 py-0.5 rounded text-[11px] font-black tracking-wider border transition',
              listeningSlotId === slot.id ? 'bg-amber-400 text-black border-amber-300 animate-pulse' : 'bg-black/40 text-zinc-200 border-zinc-700 hover:border-white']"
            title="Clic para cambiar la tecla">
            {{ listeningSlotId === slot.id ? 'Escuchando...' : keyLabel(slot.key) }}
          </button>
          <button @click.stop="removeSlot(slot)" @contextmenu.stop.prevent tabindex="-1" title="Quitar botón"
            class="absolute top-2 right-2 w-6 h-6 rounded text-xs text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
          <span class="text-4xl font-black leading-none mt-4">{{ keyLabel(slot.key) }}</span>
          <template v-if="slotSounds[slot.id]">
            <span class="font-bold text-[13px] leading-tight line-clamp-2">{{ slotSounds[slot.id].displayName }}</span>
            <span class="text-[10px] tracking-widest uppercase opacity-60">{{ slotSounds[slot.id].category }}</span>
          </template>
          <span v-else class="text-xs uppercase tracking-widest">Vacío</span>
        </div>
        <button @click="addSlot" title="Agregar botón"
          class="rounded-xl border border-dashed border-zinc-700 hover:border-lime-400 hover:text-lime-400 text-zinc-500 min-h-[140px] text-4xl font-black transition">+</button>
      </div>
      <p v-if="activeWorkspace" class="text-center text-[11px] text-zinc-600 mt-4">Asigna sonidos con ⋮ en la Biblioteca · click derecho = vaciar · clic en la tecla para cambiarla</p>
    </main>
    <main v-else class="flex-1 min-w-0">
      <div v-if="!filteredSounds.length" class="py-24 text-center text-zinc-600">
        <p class="text-5xl mb-3">🎛️</p>
        <p class="text-sm">{{ combinedLibrary.length ? 'Sin resultados' : 'Sin sonidos. Carga tu carpeta raíz.' }}</p>
        <p class="text-xs mt-1">mp3, wav, ogg, mp4, m4a, flac, webm, aac</p>
      </div>
      <div v-else class="p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <button v-for="(s, idx) in filteredSounds" :key="s.id" @click="playSound(s)" @contextmenu.prevent="toggleLoop(s)"
          :class="['group relative overflow-hidden text-left rounded-xl border p-3 min-h-[120px] flex flex-col justify-between transition active:scale-[0.97]',
            s.playing
              ? 'bg-lime-400 text-black border-lime-300 scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.5)]'
              : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600']">
          <div class="flex justify-between items-start w-full gap-1">
            <span class="text-[9px] tracking-widest font-bold opacity-60 truncate min-w-0">{{ s.category.toUpperCase() }}</span>
            <span class="flex items-center gap-1 shrink-0 ml-auto">
              <span v-if="idx < 9" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/30" :class="s.playing ? 'bg-black/20' : 'text-zinc-300'">{{ idx + 1 }}</span>
              <span role="button" title="Asignar a una mesa" @click.stop="soundToAssign = s" @contextmenu.stop.prevent
                class="w-7 h-7 flex items-center justify-center rounded bg-black/30 hover:bg-black/60 text-base font-black leading-none cursor-pointer">⋮</span>
            </span>
          </div>
          <span class="font-bold text-[13px] leading-tight line-clamp-2 text-center w-full">{{ s.displayName }}</span>
          <div class="flex items-center justify-between w-full text-[10px] uppercase opacity-70">
            <span>{{ s.ext }}<template v-if="s.loop"> · 🔁</template></span>
            <span v-if="s.playing" class="flex items-end gap-[2px] h-3">
              <i class="w-[3px] h-full bg-black animate-bounce" style="animation-duration:.4s"></i>
              <i class="w-[3px] h-2/3 bg-black animate-bounce" style="animation-duration:.55s"></i>
              <i class="w-[3px] h-full bg-black animate-bounce" style="animation-duration:.3s"></i>
            </span>
          </div>
          <div class="w-full mt-1 flex items-center gap-1.5 rounded bg-black/40 px-1.5 py-1" @click.stop @contextmenu.stop>
            <span class="text-[10px] opacity-70">🔊</span>
            <input type="range" min="0" max="1" step="0.05" v-model.number="s.vol" @input="applyVolume(s)" @click.stop @pointerdown.stop class="flex-1 min-w-0 h-1 accent-lime-400 cursor-pointer" />
          </div>
        </button>
      </div>
    </main>
    </div>

    <div v-if="soundToAssign" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" @click.self="soundToAssign = null">
      <div class="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-zinc-900 border border-zinc-700 p-5 gap-3">
        <p class="text-[11px] tracking-[0.2em] text-zinc-500 font-bold">ASIGNAR A MESA</p>
        <p class="text-lg font-bold leading-tight break-words">{{ soundToAssign.displayName }}</p>
        <div class="flex-1 overflow-y-auto flex flex-col gap-2">
          <button v-for="w in workspaces" :key="w.id" @click="addToWorkspace(w)"
            class="min-h-[56px] w-full text-left text-base px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-lime-400 active:text-black font-bold flex justify-between items-center gap-3 transition">
            <span class="truncate">{{ w.name }}</span>
            <span class="text-xs opacity-60 shrink-0">{{ w.slots.filter(sl => sl.sound).length }}/{{ w.slots.length }}</span>
          </button>
          <p v-if="!workspaces.length" class="text-sm text-zinc-500 py-2">Aún no hay mesas. Crea una para asignar este sonido.</p>
        </div>
        <button @click="createWorkspaceAndAssign" class="min-h-[56px] w-full rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-base font-black tracking-wider transition">+ NUEVA MESA</button>
        <button @click="soundToAssign = null" class="min-h-[56px] w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 text-base font-bold transition">CANCELAR</button>
      </div>
    </div>

    <footer class="border-t border-zinc-800 px-6 py-3 text-[11px] text-zinc-600 flex flex-wrap justify-between gap-2">
      <span>{{ filteredSounds.length }} / {{ totalSounds }} sonidos · {{ playingCount }} sonando</span>
      <span>1-9 disparar · ESC panic · click derecho = loop</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue'
import { Howl } from 'howler'
import { open } from '@tauri-apps/api/dialog'
import { readDir, readBinaryFile as readFile, readTextFile, writeTextFile, createDir, exists } from '@tauri-apps/api/fs'
import { appConfigDir, join, resolveResource } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

const isCapacitor = Capacitor.isNativePlatform()
const CAP_DIR = Directory.Documents
const CAP_DEFAULT_ROOT = 'KBOX'
const CAP_PREF_KEY = 'kbox_root'
const SUPPORTED = ['mp3', 'wav', 'ogg', 'mp4', 'm4a', 'flac', 'webm', 'aac']
const isTauri = typeof window !== 'undefined' && ('__TAURI_IPC__' in window || '__TAURI__' in window)

const search = ref('')
const debugError = ref('')
const masterVol = ref(0.9)
const activeCat = ref('')
const defaultLibrary = shallowRef([]) // empaquetados: [{name, sounds: [...]}]
const userLibrary = shallowRef([]) // cargados por el usuario

const combinedLibrary = computed(() => {
  const merged = new Map()
  for (const cat of [...defaultLibrary.value, ...userLibrary.value]) {
    const prev = merged.get(cat.name)
    merged.set(cat.name, prev ? { name: cat.name, sounds: [...prev.sounds, ...cat.sounds] } : cat)
  }
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
})
const howls = new Map() // id -> Howl
const playingCount = ref(0)
const loadedRoots = new Set()
const workspaces = ref([]) // [{id, name, keys: {'1'..'9': descriptor|null}}]
const activeWorkspaceId = ref(null)
const soundToAssign = ref(null)
const viewMode = ref('library') // 'library' | 'workspace'

const totalSounds = computed(() => combinedLibrary.value.reduce((a, c) => a + c.sounds.length, 0))

const filteredSounds = computed(() => {
  const q = search.value.trim().toLowerCase()
  const out = []
  for (const cat of combinedLibrary.value) {
    if (activeCat.value && activeCat.value !== cat.name) continue
    const catMatch = cat.name.toLowerCase().includes(q)
    for (const s of cat.sounds) {
      if (!q || catMatch || s.displayName.toLowerCase().includes(q)) out.push(s)
    }
  }
  return out
})

const chipClass = (active) => [
  'px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider border transition',
  active
    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
]

let counter = 0
function makeSound(category, fileName, url, rawPath = null) {
  const dot = fileName.lastIndexOf('.')
  return ref({
    id: `s${counter++}`,
    displayName: fileName.slice(0, dot).slice(0, 40),
    ext: fileName.slice(dot + 1).toLowerCase(),
    category,
    url,
    rawPath,
    playing: false,
    vol: 1,
    loop: false
  }).value
}

function buildLibrary(grouped, target = userLibrary) {
  stopAll()
  target.value = Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map(name => ({
      name,
      sounds: grouped[name].sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }))
    }))
  activeCat.value = ''
}

const extOf = (n) => n.split('.').pop().toLowerCase()

// Web: <input webkitdirectory>
async function onFolderPicked(e) {
  const files = Array.from(e.target.files)
  const grouped = {}
  for (const file of files) {
    const parts = file.webkitRelativePath.split('/')
    if (parts.length < 3) continue // debe estar dentro de una subcarpeta
    if (!SUPPORTED.includes(extOf(file.name))) continue
    const category = parts[1]
    ;(grouped[category] ||= []).push(makeSound(category, file.name, URL.createObjectURL(file)))
  }
  buildLibrary(grouped)
  e.target.value = ''
}

// Tauri: lectura recursiva con readDir + convertFileSrc
async function loadFromTauri() {
  const root = await open({ directory: true, multiple: false, recursive: true })
  if (!root || Array.isArray(root)) return

  if (loadedRoots.has(root)) return
  try {
    const cats = await loadLibraryFromPath(root)
    loadedRoots.add(root)
    userLibrary.value = [...userLibrary.value, ...cats]
  } catch (err) {
    debugError.value = 'Error cargando carpeta: ' + err
    return
  }
  await saveRoute(root)
}

// Capacitor (Android): lee Documents/<root>/<categoria>/<archivo>
async function loadCapacitorLibrary(root) {
  const cats = []
  const { files: top } = await Filesystem.readdir({ path: root, directory: CAP_DIR })
  for (const dir of top) {
    if (dir.type !== 'directory' || dir.name.startsWith('.')) continue
    const { files } = await Filesystem.readdir({ path: `${root}/${dir.name}`, directory: CAP_DIR })
    const sounds = files
      .filter(f => f.type !== 'directory' && !f.name.startsWith('.') && SUPPORTED.includes(extOf(f.name)))
      .map(f => makeSound(dir.name, f.name, '', `${root}/${dir.name}/${f.name}`))
      .sort((x, y) => x.displayName.localeCompare(y.displayName, undefined, { numeric: true }))
    if (sounds.length) cats.push({ name: dir.name, sounds })
  }
  return cats
}

async function loadFromCapacitor(root) {
  root = typeof root === 'string' ? root : CAP_DEFAULT_ROOT
  try {
    await Filesystem.requestPermissions()
    try {
      await Filesystem.readdir({ path: root, directory: CAP_DIR })
    } catch {
      await Filesystem.mkdir({ path: root, directory: CAP_DIR, recursive: true })
    }
    const cats = await loadCapacitorLibrary(root)
    if (!loadedRoots.has(root)) userLibrary.value = [...userLibrary.value, ...cats]
    loadedRoots.add(root)
    await Preferences.set({ key: CAP_PREF_KEY, value: root })
    if (!cats.length) debugError.value = `Copia tus sonidos en Documents/${root}/<categoría>/`
  } catch (err) {
    debugError.value = 'Error cargando carpeta: ' + err
  }
}

// Escanea una carpeta raíz y devuelve [{name, sounds}].
// byParent=false: categoría = subcarpeta de primer nivel (usuario).
// byParent=true: categoría = carpeta inmediata del archivo; sueltos en la raíz -> GENERAL.
async function loadLibraryFromPath(root, { byParent = false } = {}) {
  const top = await readDir(root, { recursive: true })
  const groups = new Map()
  const add = (cat, f) => {
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(f)
  }
  const walk = (entries, parentName, topName) => {
    for (const en of entries) {
      if (en.name?.startsWith('.')) continue // ocultos y papelera (.trashed-...)
      if (en.children) walk(en.children, en.name, topName ?? en.name)
      else if (en.name && SUPPORTED.includes(extOf(en.name))) {
        if (byParent) add(parentName || 'GENERAL', en)
        else if (topName) add(topName, en)
      }
    }
  }
  walk(top, null, null)

  const cats = []
  for (const [name, files] of groups) {
    const sounds = files
      .map(f => makeSound(name, f.name, convertFileSrc(f.path), f.path))
      .sort((x, y) => x.displayName.localeCompare(y.displayName, undefined, { numeric: true }))
    cats.push({ name, sounds })
  }
  return cats
}

// Android: índice generado en build (public/sonidos-index.json)
async function loadDefaultSoundsCapacitor() {
  try {
    const res = await fetch('/sonidos-index.json')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const list = await res.json()
    const grouped = new Map()
    for (const it of list) {
      if (!grouped.has(it.category)) grouped.set(it.category, [])
      grouped.get(it.category).push(makeSound(it.category, it.file, encodeURI(it.path), it.path))
    }
    defaultLibrary.value = [...grouped].map(([name, sounds]) => ({
      name,
      sounds: sounds.sort((x, y) => x.displayName.localeCompare(y.displayName, undefined, { numeric: true }))
    }))
  } catch (err) {
    console.warn('Sin sonidos por defecto:', err)
  }
}

async function loadDefaultSounds() {
  try {
    const dir = await resolveResource('sonidos-default')
    if (!(await exists(dir))) return
    defaultLibrary.value = await loadLibraryFromPath(dir, { byParent: true })
  } catch (err) {
    console.warn('Sin sonidos por defecto:', err)
  }
}

// Hoja de ruta persistente
async function getRoutesFilePath() {
  return join(await appConfigDir(), 'rutas_sonidos.json')
}

async function readRoutes() {
  try {
    const file = await getRoutesFilePath()
    if (!(await exists(file))) return []
    const data = JSON.parse(await readTextFile(file))
    return Array.isArray(data) ? data.filter(r => typeof r === 'string') : []
  } catch (err) {
    console.warn('No se pudo leer rutas_sonidos.json:', err)
    return []
  }
}

// Mesas de trabajo
const WORKSPACE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

let slotCounter = 0
const newSlotId = () => `slot-${Date.now().toString(36)}-${slotCounter++}`

function newWorkspace(name) {
  return {
    id: `ws-${Date.now()}`,
    name,
    slots: WORKSPACE_KEYS.map(k => ({ id: newSlotId(), key: k, sound: null }))
  }
}

const normKey = (k) => (k && k.length === 1 ? k.toLowerCase() : k)
const keyLabel = (k) => (!k ? '—' : k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k)

// Solo datos estables entre sesiones (el id de sonido se regenera en cada arranque)
// No se guarda `url`: las blob:/asset: no son estables. El id tampoco, porque se regenera en cada arranque.
function soundDescriptor(s) {
  return { displayName: s.displayName, ext: s.ext, category: s.category, rawPath: s.rawPath, vol: s.vol ?? 1, loop: !!s.loop }
}

function sanitizeDescriptor(d) {
  if (!d || typeof d !== 'object' || !d.rawPath) return null
  return soundDescriptor(d)
}

const sanitizeSlots = (slots) => slots.map(sl => ({ id: sl.id, key: sl.key, sound: sanitizeDescriptor(sl.sound) }))

async function getWorkspacesFilePath() {
  return join(await appConfigDir(), 'workspaces.json')
}

async function saveWorkspaces() {
  try {
    await createDir(await appConfigDir(), { recursive: true })
    await writeTextFile(await getWorkspacesFilePath(), JSON.stringify(workspaces.value.map(w => ({ id: w.id, name: w.name, slots: sanitizeSlots(w.slots) })), null, 2))
  } catch (err) {
    debugError.value = 'Error guardando mesas: ' + err
  }
}

async function loadWorkspaces() {
  try {
    const file = await getWorkspacesFilePath()
    if (!(await exists(file))) return
    const data = JSON.parse(await readTextFile(file))
    if (!Array.isArray(data)) return
    workspaces.value = data.map(w => ({
      id: w.id,
      name: w.name,
      // Soporta el formato anterior { keys: { "1": sonido } }
      slots: Array.isArray(w.slots)
        ? w.slots.map(sl => ({ id: sl.id || newSlotId(), key: sl.key ?? '', sound: sanitizeDescriptor(sl.sound) }))
        : WORKSPACE_KEYS.map(k => ({ id: newSlotId(), key: k, sound: sanitizeDescriptor(w.keys?.[k]) }))
    }))
  } catch (err) {
    console.warn('No se pudo leer workspaces.json:', err)
  }
}

async function saveRoute(newPath) {
  try {
    const routes = await readRoutes()
    if (!routes.includes(newPath)) routes.push(newPath)
    await createDir(await appConfigDir(), { recursive: true })
    await writeTextFile(await getRoutesFilePath(), JSON.stringify(routes, null, 2))
  } catch (err) {
    debugError.value = 'Error guardando ruta: ' + err
  }
}

async function loadUserRoutes() {
  const routes = await readRoutes()
  const loaded = []
  for (const route of routes) {
    if (loadedRoots.has(route)) continue
    try {
      loaded.push(...await loadLibraryFromPath(route))
      loadedRoots.add(route)
    } catch (err) {
      console.warn('Ruta no disponible:', route, err)
    }
  }
  if (loaded.length) userLibrary.value = [...userLibrary.value, ...loaded]
}

const MIME = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'audio/mp4', m4a: 'audio/mp4', flac: 'audio/flac', webm: 'audio/webm', aac: 'audio/aac' }

// Caché en RAM de Blobs por ruta (nunca se guarda en disco; empieza vacío en cada arranque)
const blobCache = new Map() // rawPath -> blobUrl
const blobPending = new Map() // rawPath -> Promise<blobUrl>

async function readCapacitorFile(path) {
  const { data } = await Filesystem.readFile({ path, directory: CAP_DIR })
  if (typeof data !== 'string') return data // Blob (web)
  const bin = atob(data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function getBlobUrl(rawPath, ext) {
  if (blobCache.has(rawPath)) return Promise.resolve(blobCache.get(rawPath))
  if (!blobPending.has(rawPath)) {
    const read = isCapacitor ? readCapacitorFile(rawPath) : readFile(rawPath)
    const p = read
      .then(contents => {
        const url = URL.createObjectURL(new Blob([contents], { type: MIME[ext] || 'audio/mpeg' }))
        blobCache.set(rawPath, url)
        return url
      })
      .finally(() => blobPending.delete(rawPath))
    blobPending.set(rawPath, p)
  }
  return blobPending.get(rawPath)
}

const isPathInUse = (rawPath) => workspaces.value.some(w => w.slots.some(sl => sl.sound?.rawPath === rawPath))

// Libera el Blob en caché si ninguna mesa lo usa ni está sonando
function releaseBlob(rawPath) {
  if (!rawPath || !blobCache.has(rawPath) || isPathInUse(rawPath)) return
  for (const cat of combinedLibrary.value) for (const sd of cat.sounds) if (sd.rawPath === rawPath && sd.playing) return
  for (const sd of fallbackSounds.values()) if (sd.rawPath === rawPath && sd.playing) return
  URL.revokeObjectURL(blobCache.get(rawPath))
  blobCache.delete(rawPath)
}

async function playSound(s) {
  if (s.playing) return stopSound(s)
  if ((isTauri || isCapacitor) && !s.rawPath) {
    debugError.value = 'Sonido sin rawPath (guardado incorrectamente): ' + s.displayName
    return
  }
  s.playing = true

  let playUrl = s.url
  if ((isTauri || isCapacitor) && s.rawPath && !s.url?.startsWith('/sonidos-default/')) {
    try {
      playUrl = await getBlobUrl(s.rawPath, s.ext)
    } catch (err) {
      debugError.value = 'Error leyendo archivo: ' + err
      s.playing = false
      return
    }
    if (!s.playing) return // detenido mientras se leía
  }

  const h = new Howl({
    src: [playUrl],
    format: [s.ext],
    html5: true,
    volume: masterVol.value * s.vol,
    loop: s.loop,
    onend: () => { if (!s.loop) finish(s, h) },
    onstop: () => finish(s, h),
    onloaderror: (id, err) => { debugError.value = 'LOAD: ' + err; finish(s, h) },
    onplayerror: (id, err) => { debugError.value = 'PLAY: ' + err; finish(s, h) }
  })
  howls.set(s.id, h)
  playingCount.value = howls.size
  h.play()
}

// Libera el buffer de Howler y el Blob; idempotente
function finish(s, h) {
  if (howls.get(s.id) === h) howls.delete(s.id)
  if (!h._done) {
    h._done = true
    setTimeout(() => h.unload(), 0)
  }
  s.playing = false
  playingCount.value = howls.size
}

function stopSound(s) {
  const h = howls.get(s.id)
  if (h) { h.stop(); finish(s, h) }
  howls.delete(s.id)
  s.playing = false
  playingCount.value = howls.size
}

function stopAll() {
  for (const h of howls.values()) { h.stop(); h._done = true; h.unload() }
  howls.clear()
  for (const cat of combinedLibrary.value) for (const s of cat.sounds) if (s.playing) s.playing = false
  for (const s of fallbackSounds.values()) s.playing = false
  playingCount.value = 0
}

function toggleLoop(s) {
  s.loop = !s.loop
  howls.get(s.id)?.loop(s.loop)
}

function applyVolume(s) {
  howls.get(s.id)?.volume(masterVol.value * s.vol)
}

watch(masterVol, () => {
  for (const cat of combinedLibrary.value) for (const s of cat.sounds) if (s.playing) applyVolume(s)
})

const activeWorkspace = computed(() => workspaces.value.find(w => w.id === activeWorkspaceId.value) || null)

// Resuelve cada descriptor guardado a un sonido vivo (de la biblioteca o uno de respaldo estable)
const fallbackSounds = new Map()
const slotSounds = computed(() => {
  const out = {}
  const ws = activeWorkspace.value
  if (!ws) return out
  const live = new Map()
  for (const cat of combinedLibrary.value) for (const sd of cat.sounds) live.set(sd.rawPath || sd.url, sd)
  for (const slot of ws.slots) {
    const d = slot.sound
    if (!d) continue
    const key = d.rawPath || d.url
    let snd = live.get(key)
    if (!snd) {
      snd = fallbackSounds.get(key)
      if (!snd) {
        snd = makeSound(d.category, `${d.displayName}.${d.ext}`, convertFileSrc(d.rawPath), d.rawPath)
        snd.vol = d.vol ?? 1
        snd.loop = !!d.loop
        fallbackSounds.set(key, snd)
      }
    }
    out[slot.id] = snd
  }
  return out
})

watch(workspaces, (list) => {
  if (!list.some(w => w.id === activeWorkspaceId.value)) activeWorkspaceId.value = list[0]?.id ?? null
}, { deep: false })

// Precarga silenciosa y secuencial de los sonidos de la mesa activa
let preloadRun = 0
async function preloadActiveWorkspace() {
  if (!isTauri) return
  const run = ++preloadRun // si cambia la mesa, la corrida anterior se cancela
  const sounds = (activeWorkspace.value?.slots ?? []).map(sl => sl.sound).filter(d => d?.rawPath)
  for (const d of sounds) {
    if (run !== preloadRun) return
    if (!blobCache.has(d.rawPath)) await getBlobUrl(d.rawPath, d.ext).catch(() => {})
  }
}

watch(() => activeWorkspace.value?.slots.map(sl => sl.sound?.rawPath ?? '').join('|'), preloadActiveWorkspace)

function createWorkspace() {
  const name = prompt('Nombre de la nueva mesa:')?.trim()
  if (!name) return
  const ws = newWorkspace(name)
  workspaces.value = [...workspaces.value, ws]
  activeWorkspaceId.value = ws.id
  saveWorkspaces()
}

function deleteWorkspace() {
  const ws = activeWorkspace.value
  if (!ws || !confirm(`¿Borrar la mesa «${ws.name}»?`)) return
  stopAll()
  workspaces.value = workspaces.value.filter(w => w.id !== ws.id)
  for (const sl of ws.slots) releaseBlob(sl.sound?.rawPath)
  saveWorkspaces()
}

function clearSlot(slot) {
  if (!slot.sound) return
  const snd = slotSounds.value[slot.id]
  if (snd?.playing) stopSound(snd)
  const path = slot.sound.rawPath
  slot.sound = null
  releaseBlob(path)
  saveWorkspaces()
}

function addSlot() {
  const ws = activeWorkspace.value
  if (!ws) return
  const used = new Set(ws.slots.map(sl => normKey(sl.key)))
  const key = [...'1234567890abcdefghijklmnopqrstuvwxyz'].find(c => !used.has(c)) ?? ''
  ws.slots.push({ id: newSlotId(), key, sound: null })
  saveWorkspaces()
}

function removeSlot(slot) {
  const ws = activeWorkspace.value
  if (!ws) return
  const snd = slotSounds.value[slot.id]
  if (snd?.playing) stopSound(snd)
  ws.slots = ws.slots.filter(sl => sl.id !== slot.id)
  releaseBlob(slot.sound?.rawPath)
  saveWorkspaces()
}

// Captura de tecla
const listeningSlotId = ref(null)
const RESERVED_KEYS = ['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'Dead', 'Unidentified']

function assignKey(slot, e) {
  const ws = activeWorkspace.value
  if (!ws) return
  const key = normKey(e.key)
  for (const other of ws.slots) if (other !== slot && normKey(other.key) === key) other.key = '' // la tecla es única
  slot.key = key
  saveWorkspaces()
}

function addToWorkspace(ws) {
  const s = soundToAssign.value
  if (!s) return
  const descriptor = soundDescriptor(s)
  const empty = ws.slots.find(sl => !sl.sound)
  if (empty) {
    empty.sound = descriptor
  } else {
    const used = new Set(ws.slots.map(sl => normKey(sl.key)))
    const key = [...'1234567890abcdefghijklmnopqrstuvwxyz'].find(c => !used.has(c)) ?? ''
    ws.slots.push({ id: newSlotId(), key, sound: descriptor })
  }
  saveWorkspaces()
  soundToAssign.value = null
}

function createWorkspaceAndAssign() {
  const name = prompt('Nombre de la nueva mesa:')?.trim()
  if (!name) return
  const ws = newWorkspace(name)
  workspaces.value = [...workspaces.value, ws]
  if (!activeWorkspaceId.value) activeWorkspaceId.value = ws.id
  addToWorkspace(ws)
}

function onKey(e) {
  if (e.key === 'Escape') {
    listeningSlotId.value = null
    return stopAll()
  }

  if (listeningSlotId.value) {
    e.preventDefault()
    e.stopPropagation()
    if (RESERVED_KEYS.includes(e.key)) return
    const slot = activeWorkspace.value?.slots.find(sl => sl.id === listeningSlotId.value)
    if (slot) assignKey(slot, e)
    listeningSlotId.value = null
    return
  }

  const tag = e.target?.tagName
  if (tag === 'INPUT' && e.target.type === 'text' || tag === 'TEXTAREA') return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  if (viewMode.value === 'workspace') {
    if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault() // evita scroll
    const key = normKey(e.key)
    const slot = activeWorkspace.value?.slots.find(sl => sl.key && normKey(sl.key) === key)
    const snd = slot && slotSounds.value[slot.id]
    if (snd) {
      e.preventDefault()
      playSound(snd)
    }
    return
  }

  if (/^[1-9]$/.test(e.key)) {
    const s = filteredSounds.value[Number(e.key) - 1]
    if (s) playSound(s)
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKey, true)
  if (isTauri) {
    await loadDefaultSounds()
    await loadUserRoutes()
    await loadWorkspaces()
  } else if (isCapacitor) {
    await loadDefaultSoundsCapacitor()
    const { value } = await Preferences.get({ key: CAP_PREF_KEY })
    if (value) await loadFromCapacitor(value)
  }
})
onUnmounted(() => { window.removeEventListener('keydown', onKey, true); stopAll() })
</script>
