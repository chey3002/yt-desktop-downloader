/**
 * Utilidad para obtener la ruta del binario de yt-dlp
 */
import path from 'path'
import { app } from 'electron'
import os from 'os'

/**
 * Obtiene la ruta al binario de yt-dlp basándose en el sistema operativo
 *
 * @returns La ruta completa al binario de yt-dlp
 */
export function getYtDlpPath(): string {
  // Determinar la extensión del binario según el sistema operativo
  const isWindows = os.platform() === 'win32'
  const binaryName = isWindows ? 'yt-dlp.exe' : 'yt-dlp'

  // En producción, usar el binario incluido con la aplicación
  if (app.isPackaged) {
    // En una aplicación empaquetada, el binario está en el directorio 'bin' de los recursos
    return path.join(process.resourcesPath, 'bin', binaryName)
  } else {
    // En desarrollo, el binario está en el directorio 'bin' de la raíz del proyecto
    return path.join(app.getAppPath(), 'bin', binaryName)
  }
}

/**
 * Configura el path de yt-dlp-exec
 *
 * @returns La configuración de yt-dlp-exec
 */
export function configureYtDlp() {
  try {
    const ytdlpPath = getYtDlpPath()
    console.log(`Usando yt-dlp desde: ${ytdlpPath}`)

    return {
      path: ytdlpPath
    }
  } catch (error) {
    console.error('Error al configurar yt-dlp:', error)
    throw error
  }
}
