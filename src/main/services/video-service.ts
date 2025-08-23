/**
 * Servicios para la gestión de videos en la aplicación
 */
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import { VideoAudioResult } from '../interfaces/video.interfaces';

/**
 * Descarga un video y su audio en archivos temporales separados
 * 
 * @param videoUrl - URL del video de YouTube a descargar
 * @param event - Evento IPC opcional para enviar progreso
 * @returns Un objeto con rutas a los archivos descargados y metadatos
 */
export async function downloadVideoAndAudio(videoUrl: string, event?: Electron.IpcMainEvent): Promise<VideoAudioResult> {
  try {
    const info = await ytdl.getInfo(videoUrl);
    
    // Filtrar los formatos de video y audio deseados que no sean webm
    const videoFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
      filter: (format) =>
        format.container !== 'webm' && format.hasVideo === true && format.hasAudio === false
    });
    
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: (format) =>
        format.container !== 'webm' && format.hasVideo === false && format.hasAudio === true
    });
    
    // Rutas para los archivos temporales
    const videoPath = path.join(app.getPath('downloads'), 'temp_video.mp4');
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio.aac');
    
    // Eliminar archivos temporales previos si existen
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    // Notificar inicio de descarga de audio (0%)
    if (event) {
      event.reply('download-progress', 0);
    }

    // Crear streams para la descarga
    const videoStream = ytdl(videoUrl, { format: videoFormat });
    const audioStream = ytdl(videoUrl, { format: audioFormat });

    // Descargar audio (10%)
    await new Promise<void>((resolve, reject) => {
      audioStream
        .pipe(fs.createWriteStream(audioPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 10);
          }
          resolve();
        })
        .on('error', reject);
    });
    
    // Descargar video (50% adicional = 60% total)
    await new Promise<void>((resolve, reject) => {
      videoStream
        .pipe(fs.createWriteStream(videoPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 60);
          }
          resolve();
        })
        .on('error', reject);
    });

    console.log('Video y audio descargados correctamente.');

    // Retornar información de los archivos descargados
    return {
      videoPath,
      audioPath,
      name: info.videoDetails.title,
      author: info.videoDetails.author.name
    };
  } catch (error) {
    console.log('Error al descargar video y audio:', error);
    throw error;
  }
}

/**
 * Descarga un video y audio usando formatos específicos seleccionados por el usuario
 * 
 * @param videoUrl - URL del video de YouTube
 * @param videoItag - ID del formato de video seleccionado
 * @param audioItag - ID del formato de audio seleccionado
 * @param event - Evento IPC opcional para enviar progreso
 * @returns Un objeto con las rutas a los archivos temporales y los metadatos del video
 */
export async function downloadCustomVideoAndAudio(
  videoUrl: string, 
  videoItag: string, 
  audioItag: string,
  event?: Electron.IpcMainEvent
): Promise<{
  videoPath: string;
  audioPath: string;
  title: string;
  author: string;
}> {
  try {
    const info = await ytdl.getInfo(videoUrl);
    
    // Buscar los formatos específicos por el itag
    const videoFormat = info.formats.find((f) => f.itag.toString() === videoItag.toString());
    const audioFormat = info.formats.find((f) => f.itag.toString() === audioItag.toString());
    
    // Verificar que se encontraron los formatos
    if (!videoFormat || !audioFormat) {
      throw new Error('No se encontraron los formatos solicitados');
    }
    
    // Rutas para los archivos temporales
    const videoPath = path.join(app.getPath('downloads'), 'temp_video_custom.mp4');
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio_custom.aac');
    
    // Eliminar archivos temporales previos si existen
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    
    // Notificar inicio de descarga (0%)
    if (event) {
      event.reply('download-progress', 0);
    }
    
    // Crear streams para la descarga
    const videoStream = ytdl(videoUrl, { format: videoFormat });
    const audioStream = ytdl(videoUrl, { format: audioFormat });
    
    // Descargar audio primero (10%)
    await new Promise<void>((resolve, reject) => {
      audioStream
        .pipe(fs.createWriteStream(audioPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 10);
          }
          resolve();
        })
        .on('error', reject);
    });
    
    // Luego descargar video (50% adicional = 60% total)
    await new Promise<void>((resolve, reject) => {
      videoStream
        .pipe(fs.createWriteStream(videoPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 60);
          }
          resolve();
        })
        .on('error', reject);
    });
    
    return {
      videoPath,
      audioPath,
      title: info.videoDetails.title,
      author: info.videoDetails.author.name
    };
  } catch (error) {
    console.error('Error al descargar video y audio custom:', error);
    throw error;
  }
}

/**
 * Obtiene los formatos disponibles para un video de YouTube
 * 
 * @param videoUrl - URL del video de YouTube
 * @returns Un objeto con la URL del embed y la lista de formatos disponibles
 */
export async function getVideoFormats(videoUrl: string): Promise<{
  url: string;
  info: ytdl.videoFormat[];
}> {
  try {
    const videoId = await ytdl.getURLVideoID(videoUrl);
    const metaInfo = await ytdl.getInfo(videoUrl);
    
    // Ordenar los formatos para mostrar primero los más útiles
    const sortedInfo = metaInfo.formats.sort((a, b) => {
      const aHasVideo = a.hasVideo;
      const aHasAudio = a.hasAudio;
      const bHasVideo = b.hasVideo;
      const bHasAudio = b.hasAudio;

      // Lógica de ordenamiento compleja para priorizar ciertos formatos
      if (aHasVideo && aHasAudio && !bHasVideo && !bHasAudio) {
        return -1;
      } else if (!aHasVideo && !aHasAudio && bHasVideo && bHasAudio) {
        return 1;
      } else if (aHasVideo && aHasAudio && bHasVideo && bHasAudio) {
        return 0;
      } else if (aHasVideo && aHasAudio && !bHasVideo && bHasAudio) {
        return -1;
      } else if (!aHasVideo && aHasAudio && bHasVideo && bHasAudio) {
        return 1;
      } else if (aHasVideo && !aHasAudio && bHasVideo && bHasAudio) {
        return -1;
      } else if (aHasVideo && aHasAudio && bHasVideo && !bHasAudio) {
        return -1;
      } else if (aHasVideo && !aHasAudio && !bHasVideo && bHasAudio) {
        return -1;
      } else if (!aHasVideo && aHasAudio && !bHasVideo && bHasAudio) {
        return 1;
      } else if (!aHasVideo && !aHasAudio && bHasVideo && !bHasAudio) {
        return 1;
      } else if (!aHasVideo && !aHasAudio && !bHasVideo && bHasAudio) {
        return 1;
      } else {
        return 0;
      }
    });
    
    return {
      url: 'https://www.youtube.com/embed/' + videoId,
      info: sortedInfo
    };
  } catch (error) {
    console.error('Error al obtener formatos de video:', error);
    throw error;
  }
}
