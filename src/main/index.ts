/**
 * Main entry point of the Electron application
 */
import { app, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './config/window-config'
import {
  handleDownloadRequest,
  handleSendUrlRequest,
  handleCustomDownloadRequest
} from './handlers/video-handler'

/**
 * Initializes the application and sets up event handlers
 */
function initialize(): void {
  // When the application is ready
  app.whenReady().then(() => {
    // Set up model ID for Windows
    electronApp.setAppUserModelId('com.electron')

    // Configure keyboard shortcuts for windows (F12 for DevTools, etc.)
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Register handlers for IPC events
    setupIpcHandlers()

    // Create the main window
    createMainWindow()

    // On macOS it's common to recreate a window when clicking the dock icon
    app.on('activate', function () {
      if (require('electron').BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })
  })

  // Quit when all windows are closed, except on macOS
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

/**
 * Sets up IPC event handlers for renderer-main communication
 */
function setupIpcHandlers(): void {
  // Handler for maximum quality download request
  ipcMain.on('download', handleDownloadRequest)

  // Handler for getting video format information
  ipcMain.on('send-url', handleSendUrlRequest)

  // Handler for custom format download
  ipcMain.on('download-custom', handleCustomDownloadRequest)
}

// Start the application
initialize()
