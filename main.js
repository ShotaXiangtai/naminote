const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 760,
    minWidth: 640,
    minHeight: 520,
    title: 'naminote',
    backgroundColor: '#e0ddd5',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())
})

app.on('window-all-closed', () => app.quit())

// ── Data storage ─────────────────────────────────────────────────────

const dataDir = path.join(app.getPath('userData'), 'notes')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

ipcMain.handle('save-note', (_e, data) => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filePath = path.join(dataDir, `note_${ts}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dataDir, 'last.txt'), filePath, 'utf-8')
  return filePath
})

ipcMain.handle('load-last', () => {
  const lastTxt = path.join(dataDir, 'last.txt')
  if (!fs.existsSync(lastTxt)) return null
  const fp = fs.readFileSync(lastTxt, 'utf-8').trim()
  if (!fs.existsSync(fp)) return null
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) } catch { return null }
})

ipcMain.handle('list-notes', () => {
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('note_') && f.endsWith('.json'))
    .sort().reverse()
  return files.map(fname => {
    const fp = path.join(dataDir, fname)
    try {
      const d = JSON.parse(fs.readFileSync(fp, 'utf-8'))
      return { path: fp, ...d }
    } catch { return null }
  }).filter(Boolean)
})

ipcMain.handle('load-note', (_e, fp) => {
  return JSON.parse(fs.readFileSync(fp, 'utf-8'))
})

ipcMain.handle('delete-note', (_e, fp) => {
  if (fs.existsSync(fp)) fs.unlinkSync(fp)
})
