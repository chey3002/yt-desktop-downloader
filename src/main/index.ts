/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, ipcMain, IpcMainEvent } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ytdl from '@distube/ytdl-core'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

// Definición de tipos
interface CustomDownloadData {
  url: string;
  videoItag: string;
  audioItag: string;
}

interface VideoAudioResult {
  videoPath: string;
  audioPath: string;
  name: string;
  author: string;
}

function createWindow(): void {
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

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  ipcMain.on('download', (event: IpcMainEvent, data: string) => {
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
  ipcMain.on('send-url', async (event: IpcMainEvent, data: string) => {
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

  ipcMain.on('download-custom', async (event: IpcMainEvent, data: CustomDownloadData) => {
    try {
      const { url, videoItag, audioItag } = data
      const outputPath = app.getPath('downloads')
      await downloadAndCombineCustom(url, videoItag, audioItag, outputPath)
      event.reply('download-custom-reply', 'success')
    } catch (error) {
      event.reply('download-custom-reply', 'error')
      console.error(error)
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
async function combineVideoAndAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
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
    // Eliminar video y audio temporales (ambos nombres posibles)
    const tempPaths = [
      path.join(app.getPath('downloads'), 'temp_video.mp4'),
      path.join(app.getPath('downloads'), 'temp_audio.aac'),
      path.join(app.getPath('downloads'), 'temp_video_custom.mp4'),
      path.join(app.getPath('downloads'), 'temp_audio_custom.aac')
    ]
    for (const tempFile of tempPaths) {
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile)
          console.log('Archivo temporal eliminado:', tempFile)
        } catch (err) {
          console.error('No se pudo eliminar el archivo temporal:', tempFile, err)
        }
      }
    }
  }
}

async function downloadAndCombine(videoUrl: string, outputPath: string): Promise<void> {
  const { videoPath, audioPath, name, author } = await downloadVideoAndAudio(videoUrl)
  const outputName = cleanStrings(name) + ' - ' + cleanStrings(author) + '.mp4'
  const finalOutputPath = path.join(outputPath, outputName)
  await combineVideoAndAudio(videoPath, audioPath, finalOutputPath)
}

async function downloadAndCombineCustom(videoUrl: string, videoItag: string, audioItag: string, outputPath: string): Promise<void> {
  const info = await ytdl.getInfo(videoUrl)
  const videoFormat = info.formats.find((f) => f.itag.toString() === videoItag.toString())
  const audioFormat = info.formats.find((f) => f.itag.toString() === audioItag.toString())
  const videoPath = path.join(app.getPath('downloads'), 'temp_video_custom.mp4')
  const audioPath = path.join(app.getPath('downloads'), 'temp_audio_custom.aac')
  if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
  if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath)
  
  if (!videoFormat || !audioFormat) {
    throw new Error('No se encontraron los formatos solicitados')
  }
  
  const videoStream = ytdl(videoUrl, { format: videoFormat })
  const audioStream = ytdl(videoUrl, { format: audioFormat })
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      videoStream.pipe(fs.createWriteStream(videoPath)).on('finish', resolve).on('error', reject)
    }),
    new Promise<void>((resolve, reject) => {
      audioStream.pipe(fs.createWriteStream(audioPath)).on('finish', resolve).on('error', reject)
    })
  ])
  const outputName =
    cleanStrings(info.videoDetails.title) +
    ' - ' +
    cleanStrings(info.videoDetails.author.name) +
    ' (custom).mp4'
  const finalOutput = path.join(outputPath, outputName)
  await combineVideoAndAudio(videoPath, audioPath, finalOutput)
}

async function downloadVideoAndAudio(videoUrl: string): Promise<VideoAudioResult> {
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
      new Promise<void>((resolve, reject) => {
        videoStream.pipe(fs.createWriteStream(videoPath)).on('finish', resolve).on('error', reject)
      }),
      new Promise<void>((resolve, reject) => {
        audioStream.pipe(fs.createWriteStream(audioPath)).on('finish', resolve).on('error', reject)
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

function cleanStrings(string: string): string {
  // Lista de caracteres no deseados
  const caracteresNoDeseados = /[<>:"/\\|?*]/g
  // Reemplazar los caracteres no deseados con un espacio en blanco
  const stringLimpio = string.replace(caracteresNoDeseados, ' ')
  return stringLimpio.trim()
}
