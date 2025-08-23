/**
 * Type definitions for yt-dlp-exec
 */

declare module 'yt-dlp-exec' {
  /**
   * YtDlpExec configuration options
   */
  export interface YtFlags {
    [key: string]: any
    dumpSingleJson?: boolean
    noWarnings?: boolean
    noCallHome?: boolean
    noCheckCertificate?: boolean
    preferFreeFormats?: boolean
    youtubeSkipDashManifest?: boolean
    referer?: string
    addHeader?: string[]
    geoBypass?: boolean
    geoBypassCountry?: string
    userAgent?: string
    cookies?: string
    output?: string
    restrictFilenames?: boolean
    format?: string
    extractAudio?: boolean
    audioFormat?: string
    audioQuality?: string | number
    ffmpegLocation?: string
  }

  export type YtDlpExecOptions = YtFlags

  /**
   * Video formats as returned by yt-dlp
   */
  export interface YtDlpVideoFormat {
    format_id: string
    format_note?: string
    ext: string
    acodec: string
    vcodec: string
    url: string
    width?: number
    height?: number
    fps?: number
    filesize?: number
    filesize_approx?: number
    tbr?: number
    abr?: number
    asr?: number
    format: string
    resolution?: string
    container?: string
    quality?: number
    has_audio?: boolean
    has_video?: boolean
    protocol?: string
    preference?: number
    dynamic_range?: string
    audio_channels?: number
  }

  /**
   * Video info as returned by yt-dlp's --dump-json flag
   */
  export interface YtDlpVideoInfo {
    id: string
    title: string
    formats: YtDlpVideoFormat[]
    thumbnails: Array<{ url: string; height?: number; width?: number }>
    thumbnail: string
    description: string
    upload_date: string
    uploader: string
    uploader_id: string
    uploader_url: string
    channel_id: string
    channel_url: string
    duration: number
    view_count: number
    average_rating?: number
    age_limit: number
    webpage_url: string
    categories: string[]
    tags: string[]
    is_live: boolean
    channel: string
    extractor: string
    webpage_url_basename: string
    extractor_key: string
    n_entries?: number
    playlist?: string
    playlist_index?: number
    playlist_id?: string
    requested_subtitles?: Record<string, any>
    requested_formats?: YtDlpVideoFormat[]
    requested_downloads?: any[]
    format: string
    format_id: string
    ext: string
    height?: number
    width?: number
  }

  /**
   * Response type for yt-dlp-exec
   */
  export type YtResponse = string

  /**
   * Main YtDlpExec function
   */
  export interface YtDlpExec {
    (url: string, args?: YtDlpExecOptions): Promise<YtResponse>
    binary: {
      path: string
      version: () => Promise<string>
    }
  }

  /**
   * Default export, creates an instance of YtDlpExec
   */
  const ytDlpExec: YtDlpExec
  export default ytDlpExec
}
