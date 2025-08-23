/**
 * Interfaces para los formatos de video y audio en la parte del renderizador
 */

export interface FormatInfo {
  itag: number
  container: string
  qualityLabel?: string
  mimeType: string
  fps?: number
  codecs: string
  audioQuality?: string
  bitrate?: number
  hasVideo: boolean
  hasAudio: boolean
}

/**
 * Representa los datos de la lista de formatos disponibles para un video
 */
export interface FormatList {
  url: string
  info: FormatInfo[]
}
