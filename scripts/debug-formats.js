/**
 * Script para depurar los formatos recibidos de yt-dlp-exec y probar la transformación
 */
const ytDlpExec = require('yt-dlp-exec')

// URL de prueba
const videoUrl = 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' // Video popular para probar

// Función para transformar formatos (versión simplificada de la función en yt-dlp-service.ts)
function transformFormat(format) {
  try {
    // Generar etiqueta de calidad
    let qualityLabel = ''

    if (format.vcodec && format.vcodec !== 'none') {
      // Para formatos de video
      const parts = []

      // Añadir resolución o altura si está disponible
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
      if (format.fps && format.fps > 30) {
        parts.push(`${format.fps}fps`)
      }

      // Añadir información sobre el códec de video
      if (format.vcodec && typeof format.vcodec === 'string') {
        console.log(`DEBUG: vcodec=${format.vcodec}, tipo=${typeof format.vcodec}`)
        try {
          const codecParts = format.vcodec.split('.')
          const codecName = codecParts.length > 0 ? codecParts[0] : format.vcodec
          const codecInfo =
            codecName === 'avc1'
              ? 'H.264'
              : codecName === 'vp9'
                ? 'VP9'
                : codecName === 'av01'
                  ? 'AV1'
                  : codecName
          parts.push(codecInfo)
        } catch (error) {
          console.error('Error procesando vcodec:', error.message)
          console.log('vcodec completo:', format.vcodec)
        }
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
    if (format.acodec && format.acodec !== 'none') {
      // Obtener y formatear el bitrate
      const bitrate = format.abr || format.tbr
      const bitrateDisplay = bitrate ? `${Math.round(bitrate)} kbps` : ''

      // Crear descripción con el códec, canales y bitrate si están disponibles
      const parts = []

      // Simplificar la presentación del códec
      if (format.acodec && format.acodec !== 'none' && typeof format.acodec === 'string') {
        console.log(`DEBUG: acodec=${format.acodec}, tipo=${typeof format.acodec}`)
        try {
          const codecParts = format.acodec.split('.')
          const codecBase = codecParts.length > 0 ? codecParts[0] : format.acodec
          parts.push(codecBase === 'mp4a' ? 'AAC' : codecBase.toUpperCase())
        } catch (error) {
          console.error('Error procesando acodec:', error.message)
          console.log('acodec completo:', format.acodec)
        }
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
    if (format.vcodec && format.vcodec !== 'none' && typeof format.vcodec === 'string') {
      try {
        const codecParts = format.vcodec.split('.')
        const codecName = codecParts.length > 0 ? codecParts[0] : format.vcodec
        simplifiedCodec =
          codecName === 'avc1'
            ? 'H.264'
            : codecName === 'vp9'
              ? 'VP9'
              : codecName === 'av01'
                ? 'AV1'
                : format.vcodec
      } catch (error) {
        console.error('Error simplificando vcodec:', error.message)
      }
    } else if (format.acodec && format.acodec !== 'none' && typeof format.acodec === 'string') {
      try {
        const codecParts = format.acodec.split('.')
        const codecName = codecParts.length > 0 ? codecParts[0] : format.acodec
        simplifiedCodec =
          codecName === 'mp4a' ? 'AAC' : codecName === 'opus' ? 'OPUS' : format.acodec
      } catch (error) {
        console.error('Error simplificando acodec:', error.message)
      }
    }

    // Calcular el bitrate de video si está disponible
    let videoBitrate = 0
    if (format.vbr) {
      videoBitrate = format.vbr
    } else if (format.tbr && format.vcodec !== 'none' && format.acodec === 'none') {
      videoBitrate = format.tbr
    }

    return {
      itag: parseInt(format.format_id) || 0, // Asegurar que itag sea siempre un número
      container: format.ext || '',
      qualityLabel: qualityLabel,
      mimeType: format.ext
        ? `${format.vcodec !== 'none' ? 'video' : 'audio'}/${format.ext}`
        : 'unknown',
      fps: format.fps || null,
      codecs: simplifiedCodec,
      audioQuality: audioQualityDescription,
      bitrate: format.abr || format.tbr || videoBitrate || 0,
      hasVideo: format.vcodec !== 'none',
      hasAudio: format.acodec !== 'none'
    }
  } catch (error) {
    console.error('Error transformando formato:', error)
    console.error('Formato original:', JSON.stringify(format, null, 2))
    // Devolver un formato básico para evitar fallos en el resto del programa
    return {
      itag: parseInt(format.format_id) || 0,
      container: format.ext || '',
      qualityLabel: 'Error - Formato incorrecto',
      mimeType: 'unknown/unknown',
      fps: null,
      codecs: '',
      audioQuality: undefined,
      bitrate: 0,
      hasVideo: false,
      hasAudio: false
    }
  }
}

async function debugTransform() {
  try {
    console.log('Obteniendo información del video...')

    // Obtener información del video
    const info = await ytDlpExec(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true
    })

    console.log(`\nTotal de formatos: ${info.formats.length}`)

    // Seleccionar algunos formatos representativos
    const videoFormats = info.formats
      .filter((f) => f.vcodec !== 'none' && f.acodec === 'none')
      .slice(0, 3)
    const audioFormats = info.formats
      .filter((f) => f.vcodec === 'none' && f.acodec !== 'none')
      .slice(0, 2)
    const combinedFormats = info.formats
      .filter((f) => f.vcodec !== 'none' && f.acodec !== 'none')
      .slice(0, 2)

    // Probar la transformación con cada formato
    console.log('\n==== Probando formatos de video ====')
    videoFormats.forEach((format, idx) => {
      console.log(`\nFormato de video #${idx + 1}:`)

      try {
        // Mostrar formato original y transformado
        console.log('Original:', JSON.stringify(format, null, 2))
        const transformed = transformFormat(format)
        console.log('Transformado:', JSON.stringify(transformed, null, 2))
      } catch (error) {
        console.error(`Error al procesar formato ${idx + 1}:`, error)
      }
    })

    console.log('\n==== Probando formatos de audio ====')
    audioFormats.forEach((format, idx) => {
      console.log(`\nFormato de audio #${idx + 1}:`)

      try {
        // Mostrar formato original y transformado
        console.log('Original:', JSON.stringify(format, null, 2))
        const transformed = transformFormat(format)
        console.log('Transformado:', JSON.stringify(transformed, null, 2))
      } catch (error) {
        console.error(`Error al procesar formato ${idx + 1}:`, error)
      }
    })

    console.log('\n==== Probando formatos combinados ====')
    combinedFormats.forEach((format, idx) => {
      console.log(`\nFormato combinado #${idx + 1}:`)

      try {
        // Mostrar formato original y transformado
        console.log('Original:', JSON.stringify(format, null, 2))
        const transformed = transformFormat(format)
        console.log('Transformado:', JSON.stringify(transformed, null, 2))
      } catch (error) {
        console.error(`Error al procesar formato ${idx + 1}:`, error)
      }
    })
  } catch (error) {
    console.error('Error al ejecutar la prueba:', error)
  }
}

// Ejecutar la prueba de transformación
debugTransform()
