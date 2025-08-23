/**
 * Interfaces para los formatos de video y audio
 */
export interface FormatInfo {
  itag: number;
  container: string;
  qualityLabel?: string;
  mimeType: string;
  fps?: number;
  codecs: string;
  audioQuality?: string;
  bitrate?: number;
  hasVideo: boolean;
  hasAudio: boolean;
}

/**
 * Representa los datos de la lista de formatos disponibles para un video
 */
export interface FormatList {
  url: string;
  info: FormatInfo[];
}

/**
 * Interfaz para los datos necesarios para descargar un video con formatos personalizados
 */
export interface CustomDownloadData {
  url: string;
  videoItag: string;
  audioItag: string;
}

/**
 * Interfaz que representa el resultado de una descarga de video y audio
 */
export interface VideoAudioResult {
  videoPath: string;
  audioPath: string;
  name: string;
  author: string;
}
