<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
    <header class="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-zinc-800">
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
        <img src="/kbox-icon.png" alt="KBOX Logo" class="h-8 md:h-10 w-auto object-contain" />
        <div class="flex rounded-full bg-zinc-900 border border-zinc-800 p-1 text-xs font-black tracking-wider">
          <button @click="viewMode = 'library'" :class="['px-4 py-1.5 rounded-full transition', viewMode === 'library' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white']">{{ $t('library').toUpperCase() }}</button>
          <button @click="viewMode = 'workspace'" :class="['px-4 py-1.5 rounded-full transition', viewMode === 'workspace' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white']">{{ $t('workspaces').toUpperCase() }}</button>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div v-if="viewMode === 'library'" class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input v-model="search" :placeholder="$t('search_placeholder')"
              class="w-64 rounded-full bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-sm outline-none focus:border-lime-400 placeholder:text-zinc-600" />
          </div>
          <label class="flex items-center gap-2 text-xs text-zinc-400 font-bold tracking-wider">
            VOL {{ Math.round(masterVol * 100) }}%
            <input type="range" min="0" max="1" step="0.01" v-model.number="masterVol" class="w-28 accent-lime-400" />
          </label>
          <button @click="stopAll" class="rounded-full bg-red-600 hover:bg-red-500 active:scale-95 px-5 py-2 text-sm font-black tracking-wider shadow-lg shadow-red-600/40 transition">
            PANIC [ESC]
          </button>
          <button @click="toggleLang" :title="$t('language')" class="rounded-full bg-zinc-900 border border-zinc-700 hover:border-white px-3 py-2 text-xs font-black tracking-wider transition">
            <span :class="locale === 'es' ? 'text-lime-400' : 'text-zinc-500'">ES</span> / <span :class="locale === 'en' ? 'text-lime-400' : 'text-zinc-500'">EN</span>
          </button>
          <template v-if="isTauri || isCapacitor">
            <button @click="importFolder" :disabled="isScanning" class="rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-40 px-5 py-2 text-sm font-black tracking-wider cursor-pointer transition">
              {{ $t('import_folder').toUpperCase() }}
            </button>
            <button @click="importFiles" :disabled="isScanning" class="rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-40 px-5 py-2 text-sm font-black tracking-wider cursor-pointer transition">
              {{ $t('import_file').toUpperCase() }}
            </button>
            <button @click="syncLibrary" :disabled="isScanning" class="rounded-full bg-zinc-900 border border-zinc-700 hover:border-white disabled:opacity-40 px-5 py-2 text-sm font-black tracking-wider cursor-pointer transition">
              🔄 {{ $t('sync').toUpperCase() }}
            </button>
          </template>
          <label v-else class="rounded-full bg-white text-black hover:bg-zinc-200 px-5 py-2 text-sm font-black tracking-wider cursor-pointer transition">
            {{ $t('import_folder').toUpperCase() }}
            <input type="file" webkitdirectory directory multiple @change="onFolderPicked" class="hidden" />
          </label>
        </div>
      </div>
    </header>
    <div v-if="isScanning" class="mx-6 mt-3 rounded bg-lime-950 border border-lime-600 text-lime-200 text-xs font-bold tracking-wider p-3 animate-pulse">{{ $t('scanning', { count: scanCount }) }}</div>

    <div class="flex flex-col md:flex-row flex-1 min-h-0">
    <aside v-if="viewMode === 'library'" class="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 p-3 md:overflow-y-auto md:sticky md:top-[73px] md:h-[calc(100vh-73px)]">
      <p class="text-[11px] tracking-[0.2em] text-zinc-500 font-bold mb-3">{{ $t('library_subfolders').toUpperCase() }}</p>
      <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
        <button @click="activeCat = ''"
          :class="['shrink-0 md:w-full flex justify-between items-center gap-3 text-left px-3 py-2.5 rounded-lg border text-xs font-bold tracking-wider uppercase transition', activeCat === '' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800']">
          <span>{{ $t('all').toUpperCase() }}</span><span class="opacity-60">{{ totalSounds }}</span>
        </button>
        <button v-for="cat in combinedLibrary" :key="cat.name" @click="activeCat = activeCat === cat.name ? '' : cat.name"
          :class="['shrink-0 md:w-full flex justify-between items-center gap-3 text-left px-3 py-2.5 rounded-lg border text-xs font-bold tracking-wider uppercase transition',
            activeCat === cat.name ? 'bg-white text-black border-white'
              : isUserCategory(cat) ? 'bg-lime-950/40 text-lime-400 border-lime-800/50 hover:bg-lime-950/70'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800']">
          <span class="truncate">{{ isUserCategory(cat) ? '📁 ' : '' }}{{ cat.name }}</span>
          <span class="flex items-center gap-2">
            <span class="opacity-60">{{ cat.sounds.length }}</span>
            <span v-if="isUserCategory(cat)" role="button" :title="$t('delete_category')" @click.stop="deleteCategory(cat.name)" class="px-1 hover:scale-125 transition">🗑️</span>
          </span>
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
        <button v-if="soundToAssign.isImported" @click="soundToAssign && renameSound(soundToAssign)" class="min-h-[56px] w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 text-base font-black tracking-wider transition">Cambiar nombre</button>
        <button v-if="soundToAssign.isImported" @click="openEditor(soundToAssign)" class="min-h-[56px] w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-lime-400/40 text-lime-400 text-base font-black tracking-wider transition">Editar audio</button>
        <button v-if="soundToAssign.isImported" @click="deleteImportedSound(soundToAssign)" class="min-h-[56px] w-full rounded-xl bg-zinc-900 border border-red-700 text-red-400 hover:bg-red-950 text-base font-black tracking-wider transition">Eliminar audio</button>
        <button @click="soundToAssign = null" class="min-h-[56px] w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 text-base font-bold transition">CANCELAR</button>
      </div>
    </div>

    <div v-if="editingSound" class="fixed inset-0 z-50 bg-black/90 flex flex-col p-4 gap-3 overflow-y-auto">
      <p class="text-[11px] tracking-[0.2em] text-zinc-500 font-bold">EDITAR AUDIO · {{ editingSound.displayName }}</p>
      <div class="relative w-full h-32 bg-zinc-800 rounded-lg overflow-hidden">
        <div ref="waveformRef" class="absolute inset-0 w-full h-full object-fill opacity-50"></div>
        <div v-if="editDuration" class="absolute top-0 bottom-0 bg-lime-500/40 z-10 pointer-events-none"
          :style="{ left: (editStart / editDuration * 100) + '%', right: (100 - (editEnd / editDuration * 100)) + '%' }"></div>
        <input type="range" min="0" :max="editDuration" step="0.01" v-model.number="editStart" @input="onStartInput" :disabled="!editReady"
          class="range-dual absolute top-0 left-0 w-full h-full z-20" aria-label="Inicio" />
        <input type="range" min="0" :max="editDuration" step="0.01" v-model.number="editEnd" @input="onEndInput" :disabled="!editReady"
          class="range-dual absolute top-0 left-0 w-full h-full z-30" aria-label="Fin" />
      </div>
      <button @click="toggleEditPlay" :disabled="!editReady" class="min-h-[56px] w-full rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-black text-2xl font-black transition">{{ editPlaying ? '⏸' : '▶' }}</button>
      <div class="flex justify-between text-sm text-zinc-300">
        <span>Inicio: {{ editStart.toFixed(2) }} s</span>
        <span>Fin: {{ editEnd.toFixed(2) }} s</span>
      </div>
      <input type="text" v-model="editName" placeholder="Nombre del archivo" class="min-h-[56px] w-full rounded-xl bg-zinc-950 border border-zinc-700 focus:border-lime-400 outline-none px-4 text-base" />
      <select v-model="editCategory" class="min-h-[56px] w-full rounded-xl bg-zinc-950 border border-zinc-700 px-4 text-base text-white">
        <option v-for="name in combinedLibrary.map(c => c.name)" :key="name" :value="name">{{ name }}</option>
      </select>
      <button @click="saveClip" :disabled="!editReady || editSaving" class="min-h-[56px] w-full rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-black text-base font-black tracking-wider transition">{{ editSaving ? 'Guardando...' : 'Guardar Recorte' }}</button>
      <button @click="closeEditor" :disabled="editSaving" class="min-h-[56px] w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-base font-bold transition">Cancelar</button>
    </div>

    <div v-if="filesToImport.length > 0" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" @click.self="!importing && resetImportModal()">
      <div class="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-zinc-900 border border-zinc-700 p-5 gap-3">
        <p class="text-[11px] tracking-[0.2em] text-zinc-500 font-bold">IMPORTAR {{ filesToImport.length }} ARCHIVO(S)</p>
        <p class="text-lg font-bold leading-tight">¿En qué categoría quieres guardarlos?</p>
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          <button v-for="name in combinedLibrary.map(c => c.name)" :key="name" @click="selectedCategory = name; newCategory = ''"
            :class="['min-h-[56px] w-full text-left text-base px-4 rounded-xl font-bold truncate transition',
              selectedCategory === name && !newCategory.trim() ? 'bg-lime-400 text-black' : 'bg-zinc-800 hover:bg-zinc-700']">{{ name }}</button>
          <p v-if="!combinedLibrary.length" class="text-sm text-zinc-500 py-2">Aún no hay categorías. Escribe una nueva.</p>
        </div>
        <input v-model="newCategory" @input="selectedCategory = ''" placeholder="O escribe una categoría nueva..."
          class="min-h-[56px] w-full rounded-xl bg-zinc-950 border border-zinc-700 focus:border-lime-400 outline-none px-4 text-base placeholder:text-zinc-600" />
        <button @click="confirmImport(newCategory.trim() || selectedCategory)" :disabled="importing || !(newCategory.trim() || selectedCategory)"
          class="min-h-[56px] w-full rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-black text-base font-black tracking-wider transition">{{ importing ? 'Importando...' : 'Importar a esta categoría' }}</button>
        <button @click="resetImportModal" :disabled="importing" class="min-h-[56px] w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-base font-bold transition">Cancelar</button>
      </div>
    </div>

    <footer class="border-t border-zinc-800 px-6 py-3 text-[11px] text-zinc-600 flex flex-wrap justify-between gap-2">
      <span>{{ filteredSounds.length }} / {{ totalSounds }} sonidos · {{ playingCount }} sonando</span>
      <span>1-9 disparar · ESC panic · click derecho = loop</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Howl } from 'howler'
import WaveSurfer from 'wavesurfer.js'
import audioBufferToWav from 'audiobuffer-to-wav'
import { open } from '@tauri-apps/api/dialog'
import { readDir, readBinaryFile as readFile, readTextFile, writeTextFile, writeBinaryFile, createDir, exists, copyFile, removeFile, renameFile, removeDir } from '@tauri-apps/api/fs'
import { appConfigDir, appDataDir, join, resolveResource } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'
import { useI18n } from 'vue-i18n'
import { FilePicker } from '@capawesome/capacitor-file-picker'

const isCapacitor = Capacitor.isNativePlatform()
const CAP_DIR = Directory.External
const CAP_DEFAULT_ROOT = 'KBOX'
const WORKSPACES_PREF_KEY = 'kbox_workspaces'
const LANG_KEY = 'kbox_lang'

const { locale } = useI18n()
function toggleLang() {
  locale.value = locale.value === 'es' ? 'en' : 'es'
  try { localStorage.setItem(LANG_KEY, locale.value) } catch (err) { console.warn('No se pudo guardar el idioma:', err) }
}
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
function makeSound(category, fileName, url, rawPath = null, isImported = false) {
  const dot = fileName.lastIndexOf('.')
  return ref({
    id: `s${counter++}`,
    displayName: fileName.slice(0, dot).slice(0, 40),
    ext: fileName.slice(dot + 1).toLowerCase(),
    category,
    url,
    rawPath,
    isImported,
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

const CAP_MUSIC_FOLDERS = ['Music', 'Música']
const isMusicPath = (p) => CAP_MUSIC_FOLDERS.some(m => p === m || p.startsWith(m + '/'))
// Las rutas bajo Music/ viven en el almacenamiento externo; el resto en Documents
const capDirFor = (path) => (isMusicPath(path) ? Directory.ExternalStorage : CAP_DIR)

const isScanning = ref(false)
const scanCount = ref(0)

const cleanName = (n) => n.replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+/, '').trim()
const baseName = (p) => p.split(/[\\/]/).pop()
const sortSounds = (list) => list.sort((x, y) => x.displayName.localeCompare(y.displayName, undefined, { numeric: true }))

function groupsToLibrary(groups) {
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map(([name, sounds]) => ({ name, sounds: sortSounds(sounds) }))
}

// Android: lectura recursiva (A > B > C). La categoría es la carpeta que contiene el archivo.
async function scanDirectory(path, categoryName, dirType, acc = new Map()) {
  let files
  try {
    ({ files } = await Filesystem.readdir({ path, directory: dirType }))
  } catch (err) {
    console.warn('No se pudo leer', path, err)
    return acc
  }
  for (const f of files) {
    if (f.name.startsWith('.')) continue
    const childPath = `${path}/${f.name}`
    if (f.type === 'directory') {
      await scanDirectory(childPath, f.name, dirType, acc)
    } else if (SUPPORTED.includes(extOf(f.name))) {
      if (!acc.has(categoryName)) acc.set(categoryName, [])
      acc.get(categoryName).push(makeSound(categoryName, f.name, '', childPath, dirType === CAP_DIR))
      scanCount.value++
    }
  }
  return acc
}

async function syncCapacitor() {
  try {
    await Filesystem.requestPermissions()
  } catch (err) {
    console.warn('Permisos de almacenamiento no concedidos:', err)
  }
  try {
    await Filesystem.mkdir({ path: CAP_DEFAULT_ROOT, directory: CAP_DIR, recursive: true })
  } catch { /* ya existe */ }
  const acc = await scanDirectory(CAP_DEFAULT_ROOT, 'GENERAL', CAP_DIR)
  for (const folder of CAP_MUSIC_FOLDERS) {
    const before = scanCount.value
    await scanDirectory(folder, 'MÚSICA', Directory.ExternalStorage, acc)
    if (scanCount.value > before) break
  }
  return groupsToLibrary(acc)
}

const kboxRoot = async () => join(await appDataDir(), CAP_DEFAULT_ROOT)

// Archivos elegidos pendientes de importar: [{ name, data? (base64, Android), path? (Tauri) }]
const filesToImport = ref([])
const selectedCategory = ref('')
const newCategory = ref('')
const importing = ref(false)

function resetImportModal() {
  filesToImport.value = []
  selectedCategory.value = ''
  newCategory.value = ''
}

async function pickFilesCapacitor() {
  let picked
  try {
    picked = await FilePicker.pickFiles({ multiple: true, readData: true })
  } catch (err) {
    if (!/cancel/i.test(String(err?.message ?? err))) debugError.value = 'Error al elegir archivos: ' + err
    return []
  }
  return picked.files
    .map(f => ({ name: cleanName(f.name || ''), data: f.data }))
    .filter(f => f.name && f.data && SUPPORTED.includes(extOf(f.name)))
}

async function pickFilesTauri() {
  const picked = await open({ multiple: true, filters: [{ name: 'Audio', extensions: SUPPORTED }] })
  if (!picked) return []
  return (Array.isArray(picked) ? picked : [picked])
    .map(p => ({ name: cleanName(baseName(p)), path: p }))
    .filter(f => f.name && SUPPORTED.includes(extOf(f.name)))
}

// Elige los archivos y abre el modal de categorías
async function importFiles() {
  if (!(isCapacitor || isTauri)) return
  try {
    const files = isCapacitor ? await pickFilesCapacitor() : await pickFilesTauri()
    if (!files.length) return
    selectedCategory.value = ''
    newCategory.value = ''
    filesToImport.value = files
  } catch (err) {
    debugError.value = 'Error al elegir archivos: ' + err
  }
}

function addImportedToLibrary(category, sounds) {
  if (!sounds.length) return
  const lib = userLibrary.value
  const idx = lib.findIndex(c => c.name === category)
  const fresh = new Set(sounds.map(s => s.rawPath))
  const merged = idx >= 0 ? [...lib[idx].sounds.filter(s => !fresh.has(s.rawPath)), ...sounds] : sounds
  const entry = { name: category, sounds: sortSounds(merged) }
  userLibrary.value = idx >= 0 ? lib.map((c, i) => (i === idx ? entry : c)) : [...lib, entry]
  // Si se sobrescribió un archivo, su Blob en caché ya no es válido
  for (const p of fresh) {
    if (blobCache.has(p)) {
      URL.revokeObjectURL(blobCache.get(p))
      blobCache.delete(p)
    }
  }
}

async function confirmImport(categoryName) {
  const category = cleanName(categoryName || '')
  if (!category) {
    debugError.value = 'Elige o escribe una categoría'
    return
  }
  if (importing.value) return
  importing.value = true
  const added = []
  let failed = 0
  let lastErr = ''
  try {
    const destDir = isTauri ? await join(await kboxRoot(), category) : null
    if (destDir) await createDir(destDir, { recursive: true })
    for (const f of filesToImport.value) {
      try {
        if (isCapacitor) {
          const rawPath = `${CAP_DEFAULT_ROOT}/${category}/${f.name}`
          await Filesystem.writeFile({ path: rawPath, directory: CAP_DIR, data: f.data, recursive: true })
          added.push(makeSound(category, f.name, '', rawPath, true))
        } else {
          const dest = await join(destDir, f.name)
          await copyFile(f.path, dest)
          added.push(makeSound(category, f.name, convertFileSrc(dest), dest, true))
        }
      } catch (err) {
        failed++
        lastErr = String(err?.message ?? err)
        console.error('No se pudo escribir en el almacenamiento externo:', f.name, err)
      }
    }
    addImportedToLibrary(category, added)
    if (failed) debugError.value = `No se pudieron importar ${failed} archivo(s). No se pudo escribir en el almacenamiento externo: ${lastErr}`
  } catch (err) {
    console.error('Error importando archivos:', err)
    debugError.value = 'Error importando archivos: ' + String(err?.message ?? err)
  } finally {
    importing.value = false
    resetImportModal()
  }
}

async function deleteImportedSound(s) {
  if (!s.isImported || !s.rawPath) return
  if (!window.confirm('¿Seguro que quieres eliminar este audio?')) return
  try {
    if (s.playing) stopSound(s)
    if (isCapacitor) await Filesystem.deleteFile({ path: s.rawPath, directory: CAP_DIR })
    else if (isTauri) await removeFile(s.rawPath)
    else return
  } catch (err) {
    debugError.value = 'Error eliminando audio: ' + err
    return
  }
  userLibrary.value = userLibrary.value
    .map(cat => ({ ...cat, sounds: cat.sounds.filter(snd => snd.id !== s.id) }))
    .filter(cat => cat.sounds.length)
  // Vacía los slots de mesas que apuntaban a este audio
  let changed = false
  for (const w of workspaces.value) {
    for (const slot of w.slots) {
      if (slot.sound && (slot.sound.id === s.id || slot.sound.rawPath === s.rawPath)) {
        const playing = slotSounds.value[slot.id]
        if (playing?.playing) stopSound(playing)
        slot.sound = null
        changed = true
      }
    }
  }
  releaseBlob(s.rawPath)
  if (changed) await saveWorkspaces()
  soundToAssign.value = null
}

const dirOf = (p) => p.replace(/[\\/][^\\/]*$/, '')
const isUserCategory = (cat) => cat.sounds.some(s => s.isImported)
const pathExists = async (p) => {
  if (isCapacitor) {
    try { await Filesystem.stat({ path: p, directory: CAP_DIR }); return true } catch { return false }
  }
  return exists(p)
}

async function renameSound(s) {
  if (!s.isImported || !s.rawPath) return
  const input = window.prompt('Nuevo nombre:', s.displayName)
  if (input === null) return
  const name = cleanName(input).replace(new RegExp(`\\.${s.ext}$`, 'i'), '')
  if (!name || name === s.displayName) return
  try {
    const oldPath = s.rawPath
    const fileName = `${name}.${s.ext}`
    let newPath
    if (isCapacitor) newPath = `${dirOf(oldPath)}/${fileName}`
    else if (isTauri) newPath = await join(dirOf(oldPath), fileName)
    else return
    if (await pathExists(newPath)) throw new Error(`ya existe un audio llamado "${fileName}"`)
    if (s.playing) stopSound(s)
    if (isCapacitor) await Filesystem.rename({ from: oldPath, to: newPath, directory: CAP_DIR, toDirectory: CAP_DIR })
    else await renameFile(oldPath, newPath)

    if (blobCache.has(oldPath)) {
      URL.revokeObjectURL(blobCache.get(oldPath))
      blobCache.delete(oldPath)
    }
    s.displayName = name
    s.rawPath = newPath
    if (isTauri) s.url = convertFileSrc(newPath)
    userLibrary.value = userLibrary.value.map(cat => (cat.sounds.includes(s) ? { ...cat, sounds: sortSounds([...cat.sounds]) } : cat))

    let changed = false
    for (const w of workspaces.value) {
      for (const slot of w.slots) {
        if (slot.sound?.rawPath === oldPath) {
          slot.sound = { ...slot.sound, rawPath: newPath, displayName: name }
          changed = true
        }
      }
    }
    if (changed) await saveWorkspaces()
  } catch (err) {
    console.error('Error cambiando nombre:', err)
    debugError.value = 'Error cambiando nombre: ' + String(err?.message ?? err)
  }
}

async function deleteCategory(catName) {
  const cat = userLibrary.value.find(c => c.name === catName)
  const targets = cat ? cat.sounds.filter(s => s.isImported && s.rawPath) : []
  if (!targets.length) return
  if (!window.confirm('¿Seguro que quieres eliminar esta categoría y todos sus audios?')) return
  const deleted = new Set()
  const dirs = new Set()
  let failed = 0
  for (const s of targets) {
    try {
      if (s.playing) stopSound(s)
      if (isCapacitor) await Filesystem.deleteFile({ path: s.rawPath, directory: CAP_DIR })
      else if (isTauri) await removeFile(s.rawPath)
      else continue
      deleted.add(s.rawPath)
      dirs.add(dirOf(s.rawPath))
    } catch (err) {
      failed++
      console.error('No se pudo eliminar', s.rawPath, err)
    }
  }
  // Borra la carpeta solo si quedó vacía (si no, el rmdir falla y se ignora)
  for (const dir of dirs) {
    try {
      if (isCapacitor) await Filesystem.rmdir({ path: dir, directory: CAP_DIR })
      else await removeDir(dir)
    } catch { /* no está vacía o ya no existe */ }
  }
  userLibrary.value = userLibrary.value
    .map(c => (c.name === catName ? { ...c, sounds: c.sounds.filter(s => !deleted.has(s.rawPath)) } : c))
    .filter(c => c.sounds.length)
  if (activeCat.value === catName && !combinedLibrary.value.some(c => c.name === catName)) activeCat.value = ''

  let changed = false
  for (const w of workspaces.value) {
    for (const slot of w.slots) {
      if (slot.sound && deleted.has(slot.sound.rawPath)) {
        const playing = slotSounds.value[slot.id]
        if (playing?.playing) stopSound(playing)
        slot.sound = null
        changed = true
      }
    }
  }
  for (const p of deleted) releaseBlob(p)
  if (changed) await saveWorkspaces()
  if (failed) debugError.value = `No se pudieron eliminar ${failed} audio(s) de la categoría`
}

// ---- Editor de audio (recorte) ----
const editingSound = ref(null)
const waveformRef = ref(null)
const editStart = ref(0)
const editEnd = ref(0)
const editDuration = ref(0)
const editName = ref('')
const editCategory = ref('')
const editPlaying = ref(false)
const editReady = ref(false)
const editSaving = ref(false)
let wavesurfer = null

function destroyWaveSurfer() {
  if (wavesurfer) {
    try { wavesurfer.pause() } catch { /* ya detenido */ }
    try { wavesurfer.destroy() } catch (err) { console.warn(err) }
    wavesurfer = null
  }
  editPlaying.value = false
  editReady.value = false
}

function openEditor(s) {
  if (!s.isImported || !s.rawPath) return
  stopAll()
  editStart.value = 0
  editEnd.value = 0
  editDuration.value = 0
  editName.value = `${s.displayName}_recortado`
  editCategory.value = s.category
  soundToAssign.value = null
  editingSound.value = s
}

function closeEditor() {
  destroyWaveSurfer()
  editingSound.value = null
}

watch(editingSound, async (s) => {
  destroyWaveSurfer()
  if (!s) return
  await nextTick()
  if (editingSound.value !== s || !waveformRef.value) return
  try {
    const url = await getBlobUrl(s.rawPath, s.ext)
    if (editingSound.value !== s) return
    const ws = WaveSurfer.create({
      container: waveformRef.value,
      url,
      sampleRate: 48000,
      height: 128,
      waveColor: '#71717a',
      progressColor: '#a3e635',
      cursorColor: '#ffffff'
    })
    wavesurfer = ws
    ws.on('ready', (dur) => {
      editDuration.value = dur
      editStart.value = 0
      editEnd.value = dur
      editReady.value = true
    })
    ws.on('play', () => { editPlaying.value = true })
    ws.on('pause', () => { editPlaying.value = false })
    ws.on('finish', () => { editPlaying.value = false })
    ws.on('timeupdate', (t) => { if (t >= editEnd.value) ws.pause() })
    ws.on('error', (err) => { debugError.value = 'Error cargando audio en el editor: ' + err })
  } catch (err) {
    debugError.value = 'Error abriendo editor: ' + err
  }
})

function toggleEditPlay() {
  if (!wavesurfer || !editReady.value) return
  if (!wavesurfer.isPlaying()) {
    const t = wavesurfer.getCurrentTime()
    if (t < editStart.value || t >= editEnd.value) wavesurfer.setTime(editStart.value)
  }
  wavesurfer.playPause()
}

const editGap = () => Math.min(0.1, editDuration.value / 2)

function onStartInput() {
  const gap = editGap()
  if (editStart.value >= editEnd.value) editStart.value = Math.max(0, editEnd.value - gap)
  if (wavesurfer && editDuration.value) wavesurfer.seekTo(editStart.value / editDuration.value)
}

function onEndInput() {
  const gap = editGap()
  if (editEnd.value <= editStart.value) editEnd.value = Math.min(editDuration.value, editStart.value + gap)
  if (wavesurfer && editDuration.value) wavesurfer.seekTo(editEnd.value / editDuration.value)
}

function bytesToBase64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  return btoa(bin)
}

async function saveClip() {
  const s = editingSound.value
  if (!s || !wavesurfer || !editReady.value || editSaving.value) return
  const category = cleanName(editCategory.value || '')
  const base = cleanName(editName.value || '').replace(/\.wav$/i, '')
  if (!category || !base) {
    debugError.value = 'Escribe un nombre y elige una categoría'
    return
  }
  editSaving.value = true
  let ctx = null
  try {
    const src = wavesurfer.getDecodedData()
    if (!src) throw new Error('el audio aún no está decodificado')
    const from = Math.max(0, Math.floor(editStart.value * src.sampleRate))
    const to = Math.min(src.length, Math.ceil(editEnd.value * src.sampleRate))
    if (to - from < 1) throw new Error('el recorte está vacío')

    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const clip = ctx.createBuffer(src.numberOfChannels, to - from, src.sampleRate)
    for (let ch = 0; ch < src.numberOfChannels; ch++) {
      clip.copyToChannel(src.getChannelData(ch).slice(from, to), ch)
    }
    const wav = new Uint8Array(audioBufferToWav(clip))
    const fileName = `${base}.wav`
    let rawPath

    if (isCapacitor) {
      rawPath = `${CAP_DEFAULT_ROOT}/${category}/${fileName}`
      if (rawPath === s.rawPath) await Filesystem.deleteFile({ path: rawPath, directory: CAP_DIR })
      await Filesystem.writeFile({ path: rawPath, directory: CAP_DIR, data: bytesToBase64(wav), recursive: true })
    } else if (isTauri) {
      const dir = await join(await kboxRoot(), category)
      await createDir(dir, { recursive: true })
      rawPath = await join(dir, fileName)
      if (rawPath === s.rawPath) await removeFile(rawPath)
      await writeBinaryFile(rawPath, wav)
    } else {
      throw new Error('plataforma no soportada')
    }

    if (rawPath === s.rawPath && s.playing) stopSound(s)
    // Si reemplazó al original con otra ruta/nombre idéntico, addImportedToLibrary lo sobrescribe por rawPath
    const sound = makeSound(category, fileName, isTauri ? convertFileSrc(rawPath) : '', rawPath, true)
    addImportedToLibrary(category, [sound])
    closeEditor()
  } catch (err) {
    debugError.value = 'Error guardando recorte: ' + err
  } finally {
    if (ctx) ctx.close().catch(() => {})
    editSaving.value = false
  }
}

// Tauri: copia la carpeta completa (con subcarpetas) a $APPDATA/KBOX/<nombre>/
async function importFolderTauri() {
  try {
    const src = await open({ directory: true, multiple: false })
    if (!src || Array.isArray(src)) return
    const dest = await join(await kboxRoot(), cleanName(baseName(src)) || 'IMPORTADO')
    await createDir(dest, { recursive: true })
    const copyEntries = async (entries, targetDir) => {
      for (const en of entries) {
        if (!en.name || en.name.startsWith('.')) continue
        if (en.children) {
          const sub = await join(targetDir, en.name)
          await createDir(sub, { recursive: true })
          await copyEntries(en.children, sub)
        } else if (SUPPORTED.includes(extOf(en.name))) {
          await copyFile(en.path, await join(targetDir, en.name))
        }
      }
    }
    await copyEntries(await readDir(src, { recursive: true }), dest)
  } catch (err) {
    debugError.value = 'Error importando carpeta: ' + err
    return
  }
  await syncLibrary()
}

async function syncTauri() {
  const root = await kboxRoot()
  if (!(await exists(root))) await createDir(root, { recursive: true })
  return loadLibraryFromPath(root, { byParent: true, imported: true })
}

const importFolder = () => (isCapacitor ? importFiles() : importFolderTauri())

async function syncLibrary() {
  if (isScanning.value || !(isCapacitor || isTauri)) return
  isScanning.value = true
  scanCount.value = 0
  stopAll()
  userLibrary.value = []
  loadedRoots.clear()
  activeCat.value = ''
  try {
    userLibrary.value = isCapacitor ? await syncCapacitor() : await syncTauri()
    // Rutas externas guardadas por versiones anteriores
    if (isTauri) await loadUserRoutes()
  } catch (err) {
    debugError.value = 'Error sincronizando: ' + err
  } finally {
    isScanning.value = false
  }
}

// Escanea una carpeta raíz y devuelve [{name, sounds}].
// byParent=false: categoría = subcarpeta de primer nivel (usuario).
// byParent=true: categoría = carpeta inmediata del archivo; sueltos en la raíz -> GENERAL.
async function loadLibraryFromPath(root, { byParent = false, imported = false } = {}) {
  const top = await readDir(root, { recursive: true })
  const groups = new Map()
  const add = (cat, f) => {
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(f)
    scanCount.value++
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
      .map(f => makeSound(name, f.name, convertFileSrc(f.path), f.path, imported))
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

const serializeWorkspaces = () => JSON.stringify(workspaces.value.map(w => ({ id: w.id, name: w.name, slots: sanitizeSlots(w.slots) })), null, 2)

async function saveWorkspaces() {
  try {
    if (isTauri) {
      await createDir(await appConfigDir(), { recursive: true })
      await writeTextFile(await getWorkspacesFilePath(), serializeWorkspaces())
    } else if (isCapacitor) {
      await Preferences.set({ key: WORKSPACES_PREF_KEY, value: serializeWorkspaces() })
    }
  } catch (err) {
    console.error('Error guardando mesas:', err)
  }
}

async function loadWorkspaces() {
  try {
    let raw = null
    if (isTauri) {
      const file = await getWorkspacesFilePath()
      if (!(await exists(file))) return
      raw = await readTextFile(file)
    } else if (isCapacitor) {
      raw = (await Preferences.get({ key: WORKSPACES_PREF_KEY })).value
    }
    if (!raw) return
    const data = JSON.parse(raw)
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
    console.error('No se pudieron leer las mesas:', err)
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
  const { data } = await Filesystem.readFile({ path, directory: capDirFor(path) })
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
    await syncLibrary()
    await loadWorkspaces()
  } else if (isCapacitor) {
    await loadWorkspaces()
    await loadDefaultSoundsCapacitor()
    await syncLibrary()
  }
})
onUnmounted(() => { window.removeEventListener('keydown', onKey, true); stopAll() })
</script>

<style>
/* Dos sliders superpuestos: solo los pulgares reciben el puntero */
.range-dual {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  pointer-events: none;
  margin: 0;
}
.range-dual::-webkit-slider-runnable-track { background: transparent; height: 100%; }
.range-dual::-moz-range-track { background: transparent; height: 100%; }
.range-dual::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto;
  width: 14px;
  height: 56px;
  background: #fff;
  border: 1px solid #a3e635;
  border-radius: 3px;
  cursor: ew-resize;
}
.range-dual::-moz-range-thumb {
  pointer-events: auto;
  width: 14px;
  height: 56px;
  background: #fff;
  border: 1px solid #a3e635;
  border-radius: 3px;
  cursor: ew-resize;
}
</style>
