/**
 * Punto de entrada principal de la aplicación Electron
 */
import { app, ipcMain } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createMainWindow } from './config/window-config';
import { 
  handleDownloadRequest, 
  handleSendUrlRequest, 
  handleCustomDownloadRequest 
} from './handlers/video-handler';

/**
 * Inicializa la aplicación y configura los manejadores de eventos
 */
function initialize(): void {
  // Cuando la aplicación esté lista
  app.whenReady().then(() => {
    // Configurar ID de modelo para Windows
    electronApp.setAppUserModelId('com.electron');

    // Configurar atajos de teclado para las ventanas (F12 para DevTools, etc.)
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    // Registrar manejadores para los eventos IPC
    setupIpcHandlers();

    // Crear la ventana principal
    createMainWindow();

    // En macOS es común recrear una ventana cuando se hace clic en el icono del dock
    app.on('activate', function () {
      if (require('electron').BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  // Salir cuando todas las ventanas estén cerradas, excepto en macOS
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

/**
 * Configura los manejadores de eventos IPC para la comunicación renderer-main
 */
function setupIpcHandlers(): void {
  // Manejador para solicitud de descarga en máxima calidad
  ipcMain.on('download', handleDownloadRequest);
  
  // Manejador para obtener información sobre formatos de video
  ipcMain.on('send-url', handleSendUrlRequest);
  
  // Manejador para descarga con formatos personalizados
  ipcMain.on('download-custom', handleCustomDownloadRequest);
}

// Iniciar la aplicación
initialize();
