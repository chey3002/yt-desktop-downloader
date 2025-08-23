/**
 * Manejador de eventos IPC relacionados con videos
 */
import { IpcMainEvent, app } from 'electron';
import path from 'path';
import { 
  downloadVideoAndAudio, 
  downloadCustomVideoAndAudio, 
  getVideoFormats 
} from '../services/video-service';
import { combineVideoAndAudio } from '../services/ffmpeg-service';
import { cleanStrings } from '../utils/string-utils';
import { CustomDownloadData } from '../interfaces/video.interfaces';

/**
 * Maneja la solicitud para descargar un video en la máxima calidad
 * 
 * @param event - Evento IPC
 * @param url - URL del video de YouTube
 */
export async function handleDownloadRequest(event: IpcMainEvent, url: string): Promise<void> {
  try {
    const outputPath = app.getPath('downloads');
    
    // Descargar el video y audio, luego combinarlos
    // Pasamos el evento para notificar progreso
    await downloadAndCombine(url, outputPath, event);
    
    // Notificar éxito al renderer
    event.reply('download-reply', 'success');
  } catch (error) {
    // Notificar error al renderer
    event.reply('download-reply', 'error');
    console.error('Error en handleDownloadRequest:', error);
  }
}

/**
 * Maneja la solicitud para obtener información sobre los formatos disponibles
 * 
 * @param event - Evento IPC
 * @param url - URL del video de YouTube
 */
export async function handleSendUrlRequest(event: IpcMainEvent, url: string): Promise<void> {
  try {
    // Obtener los formatos de video disponibles
    const formatData = await getVideoFormats(url);
    
    // Enviar datos al renderer
    event.reply('send-url-reply', formatData);
  } catch (error) {
    console.error('Error en handleSendUrlRequest:', error);
    event.reply('send-url-reply', { error: 'Error al procesar la URL' });
    throw error;
  }
}

/**
 * Maneja la solicitud para descargar un video con formatos específicos
 * 
 * @param event - Evento IPC
 * @param data - Datos de la solicitud (URL y formatos)
 */
export async function handleCustomDownloadRequest(
  event: IpcMainEvent, 
  data: CustomDownloadData
): Promise<void> {
  try {
    const { url, videoItag, audioItag } = data;
    const outputPath = app.getPath('downloads');
    
    // Realizar la descarga con los formatos personalizados
    // Pasamos el evento para notificar progreso
    await downloadAndCombineCustom(url, videoItag, audioItag, outputPath, event);
    
    // Notificar éxito al renderer
    event.reply('download-custom-reply', 'success');
  } catch (error) {
    // Notificar error al renderer
    event.reply('download-custom-reply', 'error');
    console.error('Error en handleCustomDownloadRequest:', error);
  }
}

/**
 * Descarga y combina un video en la máxima calidad disponible
 * 
 * @param videoUrl - URL del video
 * @param outputPath - Ruta donde guardar el archivo final
 * @param event - Evento IPC para enviar actualizaciones de progreso
 */
async function downloadAndCombine(videoUrl: string, outputPath: string, event?: IpcMainEvent): Promise<void> {
  // Descargar video y audio con notificación de progreso
  const { videoPath, audioPath, name, author } = await downloadVideoAndAudio(videoUrl, event);
  
  // Crear nombre de archivo limpio
  const outputName = cleanStrings(name) + ' - ' + cleanStrings(author) + '.mp4';
  const finalOutputPath = path.join(outputPath, outputName);
  
  // Combinar los archivos con notificación de progreso
  await combineVideoAndAudio(videoPath, audioPath, finalOutputPath, event);
}

/**
 * Descarga y combina un video usando formatos específicos
 * 
 * @param videoUrl - URL del video
 * @param videoItag - ID del formato de video
 * @param audioItag - ID del formato de audio
 * @param outputPath - Ruta donde guardar el archivo final
 * @param event - Evento IPC para enviar actualizaciones de progreso
 */
async function downloadAndCombineCustom(
  videoUrl: string,
  videoItag: string,
  audioItag: string,
  outputPath: string,
  event?: IpcMainEvent
): Promise<void> {
  // Descargar video y audio con formatos específicos
  const { videoPath, audioPath, title, author } = await downloadCustomVideoAndAudio(
    videoUrl, 
    videoItag, 
    audioItag,
    event
  );
  
  // Crear nombre de archivo limpio
  const outputName =
    cleanStrings(title) +
    ' - ' +
    cleanStrings(author) +
    ' (custom).mp4';
  const finalOutput = path.join(outputPath, outputName);
  
  // Combinar los archivos con notificación de progreso
  await combineVideoAndAudio(videoPath, audioPath, finalOutput, event);
}
