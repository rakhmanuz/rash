const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const BASE = 'https://rash.uz'
const VAZIFA_PATH = '/student/vazifa-topshirirish'
const CALLBACK = encodeURIComponent(VAZIFA_PATH)
/** Kompyuter kabineti: faqat login, keyin vazifa (examLab=1 — pastki havolalar yashirin) */
const START_URL = `${BASE}/login?callbackUrl=${CALLBACK}&examLab=1`

const ALLOWED_HOSTS = new Set(['rash.uz', 'www.rash.uz'])

/** Vazifa lockdown: yopish faqat veb-dagi Tugatish orqali exitExamLockdown chaqirilganda */
let examKioskActive = false

function isNavigationAllowed(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (!ALLOWED_HOSTS.has(host)) return false

    const p = u.pathname

    if (p === '/login' || p.startsWith('/login/')) return true
    if (p.startsWith('/api/')) return true
    if (p.startsWith('/_next/')) return true
    if (p === '/favicon.ico') return true
    if (p.startsWith('/icons/')) return true
    if (p === '/manifest.json' || p.startsWith('/manifest')) return true
    if (p.startsWith('/.well-known/')) return true

    if (p === VAZIFA_PATH || p.startsWith(`${VAZIFA_PATH}/`)) return true

    return false
  } catch {
    return false
  }
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    title: 'RASH — Vazifa topshirish',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:rash-vazifa-student',
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.on('close', (e) => {
    if (examKioskActive) {
      e.preventDefault()
    }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isNavigationAllowed(url)) {
      event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isNavigationAllowed(url)) {
      mainWindow.loadURL(url)
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })

  mainWindow.loadURL(START_URL)

  mainWindow.webContents.on('page-title-updated', (event) => {
    event.preventDefault()
    mainWindow.setTitle('RASH — Vazifa topshirish')
  })
}

ipcMain.handle('exam-lockdown:enter', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    examKioskActive = true
    mainWindow.setKiosk(true)
    mainWindow.setFullScreen(true)
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    if (process.platform !== 'darwin') {
      mainWindow.setMenuBarVisibility(false)
    }
  }
  return true
})

ipcMain.handle('exam-lockdown:exit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    examKioskActive = false
    mainWindow.setKiosk(false)
    mainWindow.setFullScreen(false)
    mainWindow.setAlwaysOnTop(false)
    if (process.platform !== 'darwin') {
      mainWindow.setMenuBarVisibility(true)
    }
  }
  return true
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
      if (!isNavigationAllowed(url)) event.preventDefault()
    })
  })
}
