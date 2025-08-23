/**
 * Service for yt-dlp operations
 */
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import ytDlpExec from 'yt-dlp-exec'
import { VideoAudioResult } from '../interfaces/video.interfaces'

/**
 * Gets video information using yt-dlp
 *
 * @param videoUrl - YouTube video URL
 * @returns Video information
 */
export async function getVideoInfo(videoUrl: string) {
  try {
    // Use yt-dlp to get video information with --dump-json flag
    const data = await ytDlpExec(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true
    })

    // yt-dlp-exec already returns a parsed object, no need to parse it
    return data
  } catch (error) {
    console.error('Error getting video information:', error)
    throw error
  }
}

/**
 * Downloads a video and audio to separate files
 *
 * @param videoUrl - YouTube video URL
 * @param event - Optional IPC event for progress updates
 * @returns Object with paths and metadata
 */
export async function downloadVideoAndAudio(
  videoUrl: string,
  event?: Electron.IpcMainEvent
): Promise<VideoAudioResult> {
  try {
    // Get video info first
    const info = await getVideoInfo(videoUrl)

    // Paths for temporary files
    const videoPath = path.join(app.getPath('downloads'), 'temp_video.mp4')
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio.aac')

    // Clean up any existing temp files
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath)

    // Notify start (0%)
    if (event) {
      event.reply('download-progress', 0)
    }

    // Download video
    await downloadVideoFile(videoUrl, 'bestvideo[ext!=webm]', videoPath)

    // Report 60% progress after video download
    if (event) {
      event.reply('download-progress', 60)
    }

    // Download audio
    await downloadAudioFile(videoUrl, 'bestaudio[ext!=webm]', audioPath)

    // Report 10% progress after audio download
    if (event) {
      event.reply('download-progress', 10)
    }

    return {
      videoPath,
      audioPath,
      name: info.title,
      author: info.uploader
    }
  } catch (error) {
    console.error('Error downloading video and audio:', error)
    throw error
  }
}

/**
 * Downloads a video file with yt-dlp
 *
 * @param url - Video URL
 * @param format - Format specification
 * @param outputPath - Where to save the file
 */
async function downloadVideoFile(url: string, format: string, outputPath: string): Promise<void> {
  await ytDlpExec(url, {
    format: format,
    output: outputPath,
    noWarnings: true,
    noCheckCertificate: true,
    preferFreeFormats: true
  })
}

/**
 * Downloads an audio file with yt-dlp
 *
 * @param url - Video URL
 * @param format - Format specification
 * @param outputPath - Where to save the file
 */
async function downloadAudioFile(url: string, format: string, outputPath: string): Promise<void> {
  await ytDlpExec(url, {
    format: format,
    output: outputPath,
    noWarnings: true,
    noCheckCertificate: true,
    preferFreeFormats: true
  })
}

/**
 * Gets available video formats from YouTube video
 *
 * @param videoUrl - YouTube video URL
 * @returns Object with URL and formats
 */
export async function getVideoFormats(videoUrl: string): Promise<{
  url: string
  info: any[]
}> {
  try {
    // Get video info
    const info = await getVideoInfo(videoUrl)

    // Get video ID from the info object
    const videoId = info.id

    // Sort formats as in the original code
    const sortedInfo = info.formats.sort((a: any, b: any) => {
      const aHasVideo = a.vcodec !== 'none'
      const aHasAudio = a.acodec !== 'none'
      const bHasVideo = b.vcodec !== 'none'
      const bHasAudio = b.acodec !== 'none'

      // Complex sorting logic to prioritize certain formats
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

    // Transform formats to match the expected format
    const transformedFormats = sortedInfo.map((format: any) => {
      // Generar etiqueta de calidad más descriptiva y completa
      let qualityLabel = ''

      if (format.vcodec !== 'none') {
        // Para formatos de video
        const parts = []

        // Añadir resolución o altura
        if (format.width && format.height) {
          if (format.width >= 3840 && format.height >= 2160) {
            parts.push('4K')
          } else if (format.width >= 2560 && format.height >= 1440) {
            parts.push('2K')
          }
          parts.push(`${format.width}x${format.height}`)
        } else if (format.height) {
          parts.push(`${format.height}p`)
        } else if (format.format_note && format.format_note.includes('p')) {
          parts.push(format.format_note)
        }

        // Añadir FPS si es relevante (>30)
        if (format.fps) {
          if (format.fps > 30) {
            parts.push(`${format.fps}fps`)
          }
        }

        // Añadir información sobre el códec de video de forma simplificada
        if (format.vcodec && typeof format.vcodec === 'string') {
          const codecParts = format.vcodec.split('.')
          const codecName = codecParts.length > 0 ? codecParts[0] : format.vcodec
          const codecInfo =
            codecName === 'avc1'
              ? 'H.264'
              : codecName === 'vp9'
                ? 'VP9'
                : codecName === 'av01'
                  ? 'AV1'
                  : codecName
          parts.push(codecInfo)
        }

        // Añadir rango dinámico si está disponible
        if (format.dynamic_range && format.dynamic_range !== 'SDR') {
          parts.push(format.dynamic_range)
        }

        // Calcular tamaño aproximado en MB si está disponible
        const filesize = format.filesize || format.filesize_approx
        if (filesize) {
          const sizeInMB = Math.round((filesize / (1024 * 1024)) * 10) / 10
          parts.push(`~${sizeInMB}MB`)
        }

        qualityLabel = parts.join(' · ')
      } else {
        // Para formatos de solo audio
        qualityLabel = format.format_note || 'audio only'
      }

      // Construir una descripción más detallada de la calidad de audio
      let audioQualityDescription = undefined
      if (format.acodec !== 'none') {
        // Obtener y formatear el bitrate
        const bitrate = format.abr || format.tbr
        const bitrateDisplay = bitrate ? `${Math.round(bitrate)} kbps` : ''

        // Crear descripción con el códec, canales y bitrate si están disponibles
        const parts = []

        // Simplificar la presentación del códec
        if (format.acodec && format.acodec !== 'none' && typeof format.acodec === 'string') {
          const codecParts = format.acodec.split('.')
          const codecBase = codecParts.length > 0 ? codecParts[0] : format.acodec
          parts.push(codecBase === 'mp4a' ? 'AAC' : codecBase.toUpperCase())
        }

        // Añadir información de canales
        if (format.audio_channels) {
          parts.push(`${format.audio_channels}ch`)
        }

        // Añadir bitrate si está disponible
        if (bitrateDisplay) {
          parts.push(bitrateDisplay)
        }

        audioQualityDescription = parts.join(' | ')
      }

      // Simplificar la presentación del códec de video
      let simplifiedCodec = ''
      if (format.vcodec && format.vcodec !== 'none' && typeof format.vcodec === 'string') {
        const codecParts = format.vcodec.split('.')
        const codecName = codecParts.length > 0 ? codecParts[0] : format.vcodec
        simplifiedCodec =
          codecName === 'avc1'
            ? 'H.264'
            : codecName === 'vp9'
              ? 'VP9'
              : codecName === 'av01'
                ? 'AV1'
                : format.vcodec
      } else if (format.acodec && format.acodec !== 'none' && typeof format.acodec === 'string') {
        const codecParts = format.acodec.split('.')
        const codecName = codecParts.length > 0 ? codecParts[0] : format.acodec
        simplifiedCodec =
          codecName === 'mp4a' ? 'AAC' : codecName === 'opus' ? 'OPUS' : format.acodec
      }

      // Calcular el bitrate de video si está disponible
      let videoBitrate = 0
      if (format.vbr) {
        videoBitrate = format.vbr
      } else if (format.tbr && format.vcodec !== 'none' && format.acodec === 'none') {
        videoBitrate = format.tbr
      }

      return {
        itag: parseInt(format.format_id),
        container: format.ext,
        qualityLabel: qualityLabel,
        mimeType: format.ext
          ? `${format.vcodec !== 'none' ? 'video' : 'audio'}/${format.ext}`
          : 'unknown',
        fps: format.fps,
        codecs: simplifiedCodec,
        audioQuality: audioQualityDescription,
        bitrate: format.abr || format.tbr || videoBitrate || 0,
        hasVideo: format.vcodec !== 'none',
        hasAudio: format.acodec !== 'none'
      }
    })

    return {
      url: 'https://www.youtube.com/embed/' + videoId,
      info: transformedFormats
    }
  } catch (error) {
    console.error('Error getting video formats:', error)
    throw error
  }
}

/**
 * Downloads a video and audio with custom format selections
 *
 * @param videoUrl - YouTube video URL
 * @param videoItag - Video format ID
 * @param audioItag - Audio format ID
 * @param event - Optional IPC event for progress updates
 * @returns Object with paths and metadata
 */
export async function downloadCustomVideoAndAudio(
  videoUrl: string,
  videoItag: string,
  audioItag: string,
  event?: Electron.IpcMainEvent
): Promise<{
  videoPath: string
  audioPath: string
  title: string
  author: string
}> {
  try {
    // Get video info first
    const info = await getVideoInfo(videoUrl)

    // Paths for temporary files
    const videoPath = path.join(app.getPath('downloads'), 'temp_video_custom.mp4')
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio_custom.aac')

    // Clean up any existing temp files
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath)

    // Notify download start (0%)
    if (event) {
      event.reply('download-progress', 0)
    }

    // Download audio (10%)
    await downloadAudioFile(videoUrl, audioItag, audioPath)
    if (event) {
      event.reply('download-progress', 10)
    }

    // Download video (60%)
    await downloadVideoFile(videoUrl, videoItag, videoPath)
    if (event) {
      event.reply('download-progress', 60)
    }

    return {
      videoPath,
      audioPath,
      title: info.title, // Esta propiedad se renombra como 'name' en el handler
      author: info.uploader
    }
  } catch (error) {
    console.error('Error downloading custom video and audio:', error)
    throw error
  }
}
