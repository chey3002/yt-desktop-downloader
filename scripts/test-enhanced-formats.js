const ytDlpExec = require('yt-dlp-exec')

// Función para transformar formatos según nuestra implementación actual
function transformFormat(format) {
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
    if (format.vcodec) {
      const codecName = format.vcodec.split('.')[0]
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
    if (format.acodec && format.acodec !== 'none') {
      const codecParts = format.acodec.split('.')
      parts.push(codecParts[0] === 'mp4a' ? 'AAC' : codecParts[0].toUpperCase())
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
  if (format.vcodec !== 'none') {
    const codecName = format.vcodec.split('.')[0]
    simplifiedCodec =
      codecName === 'avc1'
        ? 'H.264'
        : codecName === 'vp9'
          ? 'VP9'
          : codecName === 'av01'
            ? 'AV1'
            : format.vcodec
  } else if (format.acodec !== 'none') {
    const codecName = format.acodec.split('.')[0]
    simplifiedCodec = codecName === 'mp4a' ? 'AAC' : codecName === 'opus' ? 'OPUS' : format.acodec
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
}

async function testEnhancedFormats() {
  try {
    console.log('Obteniendo información del video...')
    // Usamos un video con más variedad de formatos (video 4K)
    const result = await ytDlpExec('https://www.youtube.com/watch?v=LXb3EKWsInQ', {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true
    })

    // Categorizar los formatos por tipo
    const videoFormats = result.formats.filter((format) => format.vcodec !== 'none')
    const audioFormats = result.formats.filter(
      (format) => format.acodec !== 'none' && format.vcodec === 'none'
    )

    // Mostrar varios tipos de formatos de video para comparar la presentación
    console.log('\n==== Ejemplos de formatos de solo video ====')

    // Intentar encontrar formatos representativos
    const videoOnlyExamples = [
      videoFormats.find((f) => f.height >= 2160 && f.acodec === 'none'), // 4K
      videoFormats.find(
        (f) => f.height >= 1080 && f.height < 1440 && f.fps > 30 && f.acodec === 'none'
      ), // 1080p 60fps
      videoFormats.find((f) => f.height >= 720 && f.height < 1080 && f.acodec === 'none'), // 720p
      videoFormats.find((f) => f.height <= 480 && f.acodec === 'none') // 480p o menos
    ].filter(Boolean)

    videoOnlyExamples.forEach((format, index) => {
      if (format) {
        console.log(`\nFormato de video #${index + 1}:`)
        console.log('Original:', {
          format_id: format.format_id,
          ext: format.ext,
          vcodec: format.vcodec,
          resolution: format.resolution || `${format.width}x${format.height}`,
          fps: format.fps,
          dynamic_range: format.dynamic_range,
          filesize_approx: format.filesize_approx
        })
        console.log('Transformado:', transformFormat(format))
      }
    })

    console.log('\n==== Ejemplos de formatos de audio ====')
    audioFormats.slice(0, 2).forEach((format, index) => {
      console.log(`\nFormato de audio #${index + 1}:`)
      console.log('Original:', {
        format_id: format.format_id,
        ext: format.ext,
        acodec: format.acodec,
        audio_channels: format.audio_channels,
        abr: format.abr,
        tbr: format.tbr
      })
      console.log('Transformado:', transformFormat(format))
    })

    console.log('\n==== Ejemplos de formatos combinados (video + audio) ====')
    const combinedFormats = videoFormats.filter((format) => format.acodec !== 'none').slice(0, 2)
    combinedFormats.forEach((format, index) => {
      console.log(`\nFormato combinado #${index + 1}:`)
      console.log('Original:', {
        format_id: format.format_id,
        ext: format.ext,
        vcodec: format.vcodec,
        acodec: format.acodec,
        resolution: format.resolution || `${format.width}x${format.height}`,
        fps: format.fps,
        tbr: format.tbr
      })
      console.log('Transformado:', transformFormat(format))
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

testEnhancedFormats()
