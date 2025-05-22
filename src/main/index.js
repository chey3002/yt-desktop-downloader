import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ytdl from '@distube/ytdl-core'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

function createWindow() {
  // Create the browser window.
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
  //Get the paths to the packaged versions of the binaries we want to use
  const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
  const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')
  //tell the ffmpeg package where it can find the needed binaries.
  ffmpeg.setFfmpegPath(ffmpegPath)
  ffmpeg.setFfprobePath(ffprobePath)
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  ipcMain.on('download', (event, data) => {
    try {
      const url = data
      const outputPath = app.getPath('downloads')
      downloadAndCombine(url, outputPath)
        .then(() => {
          event.reply('download-reply', 'success')
        })
        .catch((error) => {
          event.reply('download-reply', 'error')
          throw error
        })
    } catch (error) {
      event.reply('download-reply', 'error')
      throw error
    }
  })
  // IPC event for downloading video
  ipcMain.on('send-url', async (event, data) => {
    try {
      const url = data
      const videoId = await ytdl.getURLVideoID(url)
      const metaInfo = await ytdl.getInfo(url)
      let newData = {
        url: 'https://www.youtube.com/embed/' + videoId,
        info: metaInfo.formats
      }
      const sortedInfo = metaInfo.formats.sort((a, b) => {
        const aHasVideo = a.hasVideo
        const aHasAudio = a.hasAudio
        const bHasVideo = b.hasVideo
        const bHasAudio = b.hasAudio

        if (aHasVideo && aHasAudio && !bHasVideo && !bHasAudio) {
          return -1
        } else if (!aHasVideo && !aHasAudio && bHasVideo && bHasAudio) {
          return 1
        } else if (aHasVideo && aHasAudio && bHasVideo && bHasAudio) {
          return 0
        } else if (aHasVideo && aHasAudio && !bHasVideo && bHasAudio) {
          return -1
        } else if (!aHasVideo && aHasAudio && bHasVideo && bHasAudio) {
          return 1
        } else if (aHasVideo && !aHasAudio && bHasVideo && bHasAudio) {
          return -1
        } else if (aHasVideo && aHasAudio && bHasVideo && !bHasAudio) {
          return -1
        } else if (aHasVideo && !aHasAudio && !bHasVideo && bHasAudio) {
          return -1
        } else if (!aHasVideo && aHasAudio && !bHasVideo && bHasAudio) {
          return 1
        } else if (!aHasVideo && !aHasAudio && bHasVideo && !bHasAudio) {
          return 1
        } else if (!aHasVideo && !aHasAudio && !bHasVideo && bHasAudio) {
          return 1
        } else {
          return 0
        }
      })

      newData.info = sortedInfo
      event.reply('send-url-reply', newData)
    } catch (error) {
      console.log(error)
      throw error
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// Combinar el video y el audio usando ffmpeg
async function combineVideoAndAudio(videoPath, audioPath, outputPath) {
  try {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions('-c:v copy')
        .outputOptions('-c:a aac')
        .output(outputPath)
        .on('end', () => {
          console.log('Combinación de audio y video completada')
          resolve()
        })
        .on('error', (err) => {
          console.error('Error al combinar video y audio:', err)
          reject(err)
        })
        .run()
    })
  } catch (error) {
    console.log('Error al combinar video y audio:', error)
    throw error
  } finally {
    // Eliminar video y audio temporales
    const videoPath = path.join(app.getPath('downloads'), 'temp_video.mp4')
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio.aac')
    if (fs.existsSync(videoPath)) {
      deleteFile(videoPath)
    }
    if (fs.existsSync(audioPath)) {
      deleteFile(audioPath)
    }
  }
}

async function downloadAndCombine(videoUrl, outputPath) {
  try {
    const { videoPath, audioPath, name, author } = await downloadVideoAndAudio(videoUrl, outputPath)
    const outputName = cleanStrings(name) + ' - ' + cleanStrings(author) + '.mp4'
    outputPath = path.join(outputPath, outputName)
    await combineVideoAndAudio(videoPath, audioPath, outputPath)
  } catch (error) {
    console.error('Error al descargar y combinar video y audio:', error)
    throw error
  }
}

async function downloadVideoAndAudio(videoUrl) {
  try {
    const info = await ytdl.getInfo(videoUrl)
    // Filtrar los formatos de video y audio deseados que no sean webm
    const videoFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
      filter: (format) =>
        format.container !== 'webm' && format.hasVideo === true && format.hasAudio === false
    })
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: (format) =>
        format.container !== 'webm' && format.hasVideo === false && format.hasAudio === true
    })
    // Descargar video y audio
    const videoPath = path.join(app.getPath('downloads'), 'temp_video.mp4')
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio.aac')
    // Check if videoPath and audioPath exist and delete them if they exist
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath)
    }

    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath)
    }

    const videoStream = ytdl(videoUrl, { format: videoFormat })
    const audioStream = ytdl(videoUrl, { format: audioFormat })

    await Promise.all([
      new Promise((resolve, reject) => {
        videoStream.pipe(fs.createWriteStream(videoPath))
          .on('finish', resolve)
          .on('error', reject)
      }),
      new Promise((resolve, reject) => {
        audioStream.pipe(fs.createWriteStream(audioPath))
          .on('finish', resolve)
          .on('error', reject)
      })
    ])

    console.log('Video y audio descargados correctamente.')

    return {
      videoPath,
      audioPath,
      name: info.videoDetails.title,
      author: info.videoDetails.author.name
    }
  } catch (error) {
    console.log('Error al descargar video y audio:', error)
    throw error
  }
}

// Eliminar archivo
function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error al eliminar archivo:', err)
        reject(err)
      } else {
        console.log('Archivo eliminado:', filePath)
        resolve()
      }
    })
  })
}
function cleanStrings(string) {
  // Lista de caracteres no deseados
  const caracteresNoDeseados = /[<>:"\/\\|?*]/g
  // Reemplazar los caracteres no deseados con un espacio en blanco
  const stringLimpio = string.replace(caracteresNoDeseados, ' ')
  return stringLimpio.trim()
}
