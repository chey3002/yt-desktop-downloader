/**
 * Servicio para el manejo de operaciones de FFmpeg
 */
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Configura el entorno FFmpeg con las rutas correctas a los binarios
 */
export function configureFFmpeg(): void {
  // Obtener las rutas a los binarios empaquetados, considerando la estructura de asar
  const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');
  const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked');
  
  // Configurar las rutas en ffmpeg
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
}

/**
 * Combina archivos de video y audio utilizando ffmpeg
 * 
 * @param videoPath - Ruta al archivo de video
 * @param audioPath - Ruta al archivo de audio
 * @param outputPath - Ruta donde se guardará el archivo combinado
 * @param event - Evento IPC opcional para enviar progreso
 * @returns Una promesa que se resuelve cuando se completa la combinación
 */
export async function combineVideoAndAudio(
  videoPath: string, 
  audioPath: string, 
  outputPath: string,
  event?: Electron.IpcMainEvent
): Promise<void> {
  try {
    // Indicar inicio de la combinación (60% ya completado anteriormente)
    if (event) {
      event.reply('download-progress', 60);
    }
    
    // Usar Promise para manejar la operación asíncrona de ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)  // Entrada de video
        .input(audioPath)  // Entrada de audio
        .outputOptions('-c:v copy')  // Copiar video sin re-codificar
        .outputOptions('-c:a aac')   // Codificar audio a AAC
        .output(outputPath)          // Archivo de salida
        .on('progress', (progress) => {
          // FFmpeg no proporciona un progreso confiable, así que usamos un valor fijo
          // Combinación vale 30% (desde 60% hasta 90%)
          if (event) {
            event.reply('download-progress', 90);
          }
        })
        .on('end', () => {
          console.log('Combinación de audio y video completada');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error al combinar video y audio:', err);
          reject(err);
        })
        .run();  // Iniciar proceso
    });
    
    // Avanzar al 90% después de la combinación
    if (event) {
      event.reply('download-progress', 90);
    }
  } catch (error) {
    console.log('Error al combinar video y audio:', error);
    throw error;
  } finally {
    // Limpiar archivos temporales (9% más)
    if (event) {
      event.reply('download-progress', 99);
    }
    cleanupTempFiles();
    
    // Proceso completado (100%)
    if (event) {
      event.reply('download-progress', 100);
    }
  }
}

/**
 * Limpia los archivos temporales generados durante el proceso
 */
export function cleanupTempFiles(): void {
  const tempPaths = [
    path.join(app.getPath('downloads'), 'temp_video.mp4'),
    path.join(app.getPath('downloads'), 'temp_audio.aac'),
    path.join(app.getPath('downloads'), 'temp_video_custom.mp4'),
    path.join(app.getPath('downloads'), 'temp_audio_custom.aac')
  ];
  
  for (const tempFile of tempPaths) {
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
        console.log('Archivo temporal eliminado:', tempFile);
      } catch (err) {
        console.error('No se pudo eliminar el archivo temporal:', tempFile, err);
      }
    }
  }
}
