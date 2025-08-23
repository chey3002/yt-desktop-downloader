/**
 * Script para comprobar e instalar yt-dlp en el sistema
 */

const { exec, execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')
const https = require('https')

// Determina el sistema operativo
const platform = os.platform()
const isWindows = platform === 'win32'
const isMac = platform === 'darwin'
const isLinux = platform === 'linux'

// Ruta donde se guardará yt-dlp
const ytdlpBinaryDir = path.join(__dirname, '..', 'bin')
const ytdlpPath = path.join(ytdlpBinaryDir, isWindows ? 'yt-dlp.exe' : 'yt-dlp')

/**
 * Crea el directorio bin si no existe
 */
function ensureBinDirectory() {
  if (!fs.existsSync(ytdlpBinaryDir)) {
    console.log('Creando directorio bin...')
    fs.mkdirSync(ytdlpBinaryDir, { recursive: true })
  }
}

/**
 * Descarga un archivo desde una URL
 */
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`Descargando desde ${url} a ${destination}...`)

    // Crea un stream de escritura
    const fileStream = fs.createWriteStream(destination)

    // Realiza la solicitud HTTPS
    https
      .get(url, (response) => {
        // Maneja redirecciones
        if (response.statusCode === 302 || response.statusCode === 301) {
          console.log(`Redireccionando a ${response.headers.location}...`)
          downloadFile(response.headers.location, destination).then(resolve).catch(reject)
          return
        }

        // Verifica si la respuesta es exitosa
        if (response.statusCode !== 200) {
          reject(new Error(`Error al descargar: código de estado ${response.statusCode}`))
          return
        }

        // Canaliza la respuesta al archivo
        response.pipe(fileStream)

        // Maneja eventos
        fileStream.on('finish', () => {
          fileStream.close()
          console.log('Descarga completada.')
          resolve()
        })

        fileStream.on('error', (err) => {
          fs.unlinkSync(destination)
          reject(err)
        })
      })
      .on('error', (err) => {
        fs.unlinkSync(destination)
        reject(err)
      })
  })
}

/**
 * Descarga yt-dlp según el sistema operativo
 */
async function downloadYtDlp() {
  try {
    ensureBinDirectory()

    console.log('Descargando yt-dlp...')

    // URLs de descarga para diferentes sistemas operativos
    let downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/'

    if (isWindows) {
      downloadUrl += 'yt-dlp.exe'
    } else {
      downloadUrl += 'yt-dlp'
    }

    // Descargar el archivo
    await downloadFile(downloadUrl, ytdlpPath)

    // En sistemas no Windows, asegurarse de que el archivo sea ejecutable
    if (!isWindows) {
      fs.chmodSync(ytdlpPath, '755')
    }

    console.log('yt-dlp instalado correctamente en:', ytdlpPath)

    // Verificar la instalación
    verifyInstallation()
  } catch (error) {
    console.error('Error al descargar yt-dlp:', error.message)
  }
}

/**
 * Verifica si yt-dlp está instalado correctamente
 */
function verifyInstallation() {
  if (fs.existsSync(ytdlpPath)) {
    console.log(`yt-dlp existe en ${ytdlpPath}`)
    console.log('Tamaño del archivo:', fs.statSync(ytdlpPath).size, 'bytes')

    try {
      if (isWindows) {
        const output = execSync(`"${ytdlpPath}" --version`).toString()
        console.log('Versión de yt-dlp:', output.trim())
      } else {
        const output = execSync(`"${ytdlpPath}" --version`).toString()
        console.log('Versión de yt-dlp:', output.trim())
      }
    } catch (error) {
      console.error('Error al verificar la versión:', error.message)
    }
  } else {
    console.error('yt-dlp no fue instalado correctamente.')
  }
}

/**
 * Verifica si yt-dlp está instalado
 */
function checkYtDlp() {
  console.log('Verificando instalación de yt-dlp...')
  console.log('Ruta esperada:', ytdlpPath)

  // Verificar si el archivo existe
  if (fs.existsSync(ytdlpPath)) {
    console.log('yt-dlp ya está instalado')
    verifyInstallation()
    return true
  }

  console.log('yt-dlp no está instalado, procediendo con la instalación...')
  return false
}

/**
 * Función principal
 */
async function main() {
  try {
    if (!checkYtDlp()) {
      await downloadYtDlp()
    }
  } catch (error) {
    console.error('Error en la instalación:', error.message)
  }
}

// Ejecutar el script
main()
