/**
 * Script para probar la transformación de formatos como lo hace yt-dlp-service
 */
const ytDlpExec = require('yt-dlp-exec')

// Simular la función que transforma los formatos
function transformFormat(format) {
  // Generar etiqueta de calidad más descriptiva
  let qualityLabel = ''

  if (format.vcodec !== 'none') {
    // Para formatos de video, mostrar resolución o altura
    if (format.resolution) {
      qualityLabel = format.resolution
    } else if (format.height) {
      qualityLabel = `${format.height}p`
      if (format.fps && format.fps > 30) {
        qualityLabel += ` ${format.fps}fps`
      }
    } else {
      qualityLabel = format.format_note || 'video'
    }
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

  return {
    itag: parseInt(format.format_id),
    container: format.ext,
    qualityLabel: qualityLabel,
    mimeType: format.ext
      ? `${format.vcodec !== 'none' ? 'video' : 'audio'}/${format.ext}`
      : 'unknown',
    fps: format.fps,
    codecs: format.vcodec !== 'none' ? format.vcodec : format.acodec,
    audioQuality: audioQualityDescription,
    bitrate: format.abr || format.tbr || 0,
    hasVideo: format.vcodec !== 'none',
    hasAudio: format.acodec !== 'none'
  }
}

async function testFormatTransformation() {
  try {
    console.log('Obteniendo información del video...')
    const result = await ytDlpExec('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true
    })

    // Mostrar algunos formatos de ejemplo
    console.log('\n==== Formatos de Audio ====')
    const audioFormats = result.formats
      .filter((format) => format.acodec !== 'none' && format.vcodec === 'none')
      .slice(0, 3)

    audioFormats.forEach((format, index) => {
      const transformed = transformFormat(format)
      console.log(`\nFormato de Audio #${index + 1}:`)
      console.log('Original:', {
        format_id: format.format_id,
        ext: format.ext,
        acodec: format.acodec,
        audio_channels: format.audio_channels,
        abr: format.abr,
        tbr: format.tbr,
        format_note: format.format_note
      })
      console.log('Transformado:', transformed)
    })

    console.log('\n==== Formatos de Video (solo video) ====')
    const videoFormats = result.formats
      .filter((format) => format.vcodec !== 'none' && format.acodec === 'none')
      .slice(0, 3)

    videoFormats.forEach((format, index) => {
      const transformed = transformFormat(format)
      console.log(`\nFormato de Video #${index + 1}:`)
      console.log('Original:', {
        format_id: format.format_id,
        ext: format.ext,
        vcodec: format.vcodec,
        height: format.height,
        width: format.width,
        fps: format.fps,
        tbr: format.tbr,
        format_note: format.format_note
      })
      console.log('Transformado:', transformed)
    })

    console.log('\n==== Formatos Combinados (audio + video) ====')
    const combinedFormats = result.formats
      .filter((format) => format.vcodec !== 'none' && format.acodec !== 'none')
      .slice(0, 3)

    combinedFormats.forEach((format, index) => {
      const transformed = transformFormat(format)
      console.log(`\nFormato Combinado #${index + 1}:`)
      console.log('Original:', {
        format_id: format.format_id,
        ext: format.ext,
        vcodec: format.vcodec,
        acodec: format.acodec,
        height: format.height,
        audio_channels: format.audio_channels,
        fps: format.fps,
        abr: format.abr,
        tbr: format.tbr,
        format_note: format.format_note
      })
      console.log('Transformado:', transformed)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

testFormatTransformation()
