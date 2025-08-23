/**
 * Service for handling FFmpeg operations
 */
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

/**
 * Configure the FFmpeg environment with the correct binary paths
 */
export function configureFFmpeg(): void {
  // Get paths to packaged binaries, considering the asar structure
  const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
  const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')

  // Configure paths in ffmpeg
  ffmpeg.setFfmpegPath(ffmpegPath)
  ffmpeg.setFfprobePath(ffprobePath)
}

/**
 * Combines video and audio files using ffmpeg
 *
 * @param videoPath - Path to the video file
 * @param audioPath - Path to the audio file
 * @param outputPath - Path where the combined file will be saved
 * @param event - Optional IPC event to send progress updates
 * @returns A promise that resolves when the combination is complete
 */
export async function combineVideoAndAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  event?: Electron.IpcMainEvent
): Promise<void> {
  try {
    // Indicate start of combination (60% already completed previously)
    if (event) {
      event.reply('download-progress', 60)
    }

    // Use Promise to handle ffmpeg's asynchronous operation
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath) // Video input
        .input(audioPath) // Audio input
        .outputOptions('-c:v copy') // Copy video without re-encoding
        .outputOptions('-c:a aac') // Encode audio to AAC
        .output(outputPath) // Output file
        .on('progress', (progress) => {
          // FFmpeg doesn't provide reliable progress, so we use a fixed value
          // Combination is worth 30% (from 60% to 90%)
          if (event) {
            event.reply('download-progress', 90)
          }
        })
        .on('end', () => {
          console.log('Video and audio combination completed')
          resolve()
        })
        .on('error', (err) => {
          console.error('Error combining video and audio:', err)
          reject(err)
        })
        .run() // Start process
    })

    // Advance to 90% after combination
    if (event) {
      event.reply('download-progress', 90)
    }
  } catch (error) {
    console.log('Error combining video and audio:', error)
    throw error
  } finally {
    // Clean up temporary files (9% more)
    if (event) {
      event.reply('download-progress', 99)
    }
    cleanupTempFiles()

    // Process completed (100%)
    if (event) {
      event.reply('download-progress', 100)
    }
  }
}

/**
 * Cleans up temporary files generated during the process
 */
export function cleanupTempFiles(): void {
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
        console.log('Temporary file removed:', tempFile)
      } catch (err) {
        console.error('Could not delete temporary file:', tempFile, err)
      }
    }
  }
}
