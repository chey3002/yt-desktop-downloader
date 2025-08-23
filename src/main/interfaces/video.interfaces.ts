/**
 * Interfaces for video and audio formats
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
 * Represents the available format list data for a video
 */
export interface FormatList {
  url: string
  info: FormatInfo[]
}

/**
 * Interface for the data needed to download a video with custom formats
 */
export interface CustomDownloadData {
  url: string
  videoItag: string
  audioItag: string
}

/**
 * Interface that represents the result of a video and audio download
 */
export interface VideoAudioResult {
  videoPath: string
  audioPath: string
  name: string
  author: string
}
