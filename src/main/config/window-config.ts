/**
 * Configuración de la ventana principal de la aplicación
 */
import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'
import { configureFFmpeg } from '../services/ffmpeg-service'

/**
 * Crea y configura la ventana principal de la aplicación
 *
 * @returns La instancia de BrowserWindow creada
 */
export function createMainWindow(): BrowserWindow {
  // Crear la ventana del navegador con la configuración básica
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true
    }
  })

  // Configurar FFmpeg
  configureFFmpeg()

  // Mostrar la ventana cuando esté lista
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Configurar el manejo de enlaces externos
  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Abrir enlaces en el navegador predeterminado del sistema
    require('electron').shell.openExternal(details.url)
    return { action: 'deny' } // Evitar que se abra en la app
  })

  // Cargar el contenido - URL en desarrollo o archivo HTML en producción
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
