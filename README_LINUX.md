
# Caja de Sonidos PRO - Guía Linux

## Estructura que pide el software
```
/mi-libreria/           <- esta es tu carpeta raíz
  /risas/
    risa1.mp3
    jajaja.wav
  /aplausos/
    aplauso.mp3
  /golpes/
    bofetada.ogg
```
El nombre de cada subcarpeta se convierte automáticamente en una sección en la UI.

Formatos soportados: mp3, wav, ogg, mp4 (solo audio), m4a, flac, webm, aac

## Instalación en Linux (Ubuntu/Debian/Mint)

### 1. Prerrequisitos Tauri (para .deb y .exe)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Instalar Node
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Instalar proyecto
```bash
npm install
npm run dev  # prueba en navegador http://localhost:1420
```

### 4. Compilar .deb (nativo Linux)
```bash
npm run tauri:build -- --bundles deb
# Sale en: src-tauri/target/release/bundle/deb/*.deb
sudo dpkg -i src-tauri/target/release/bundle/deb/*.deb
```

### 5. Compilar .exe desde Linux (cross-compile)
```bash
# Instalar target Windows
rustup target add x86_64-pc-windows-gnu
sudo apt install mingw-w64

# Compilar
npm run tauri:build:exe
# Sale en: src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/*.exe
```

### 6. Compilar APK Android
```bash
npm run build
npm install @capacitor/android
npx cap add android
npx cap sync

# Necesitas Android Studio instalado
npx cap open android
# Dentro de Android Studio: Build > Build APK
```

## Lógica clave Vue

En modo web usamos `webkitdirectory`:
```js
const files = e.target.files // contiene webkitRelativePath = "root/risas/file.mp3"
```

En modo Tauri (recomendado para show real sin latencia):
```js
import { readDir } from '@tauri-apps/api/fs'
import { convertFileSrc } from '@tauri-apps/api/tauri'
const entries = await readDir('/home/carlos/mi-libreria', { recursive: true })
// entries -> agrupas por parent folder
```

## Tips para shows en vivo
- Activa "Siempre encima" en Tauri: `"alwaysOnTop": true` en tauri.conf.json
- Pon `ESC` como PANIC
- Usa teclas 1-9 para disparar rápido
- Click derecho = loop (útil para lluvia, tensión)
- Volumen master separado de volumen por botón

## Siguiente paso
1. Crea tu carpeta `/home/tuusuario/sonidos/` con subcarpetas
2. En `src-tauri/tauri.conf.json` pon `"resources": ["/home/tuusuario/sonidos/*"]` para empaquetar sonidos dentro del .deb/.exe
3. `npm run tauri:build`

## Compilar .exe desde Linux (cross-compile)
```bash
sudo apt install mingw-w64 nsis
rustup target add x86_64-pc-windows-gnu
npm run tauri:build:exe
```

## Android (Capacitor 5)
```bash
npm run build
npm run cap:setup
```
