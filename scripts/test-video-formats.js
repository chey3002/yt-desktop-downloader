const ytDlpExec = require('yt-dlp-exec')

async function testVideoFormats() {
  try {
    console.log('Obteniendo información del video...')
    const result = await ytDlpExec('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true
    })

    console.log(`\n==== Propiedades disponibles en formatos de video ====`)
    // Recopilar todas las propiedades disponibles en los formatos de video
    const videoFormats = result.formats.filter((format) => format.vcodec !== 'none')
    const allProperties = new Set()
    videoFormats.forEach((format) => {
      Object.keys(format).forEach((key) => allProperties.add(key))
    })
    console.log([...allProperties].sort().join(', '))

    // Mostrar ejemplos de diferentes tipos de formatos de video
    const videoOnlyFormats = videoFormats.filter((format) => format.acodec === 'none')
    const combinedFormats = videoFormats.filter((format) => format.acodec !== 'none')

    console.log(`\n==== Ejemplos de formatos de video (solo video) ====`)
    const videoOnlyExamples = [
      // Formato de alta resolución
      videoOnlyFormats.find((f) => f.height >= 1080) || videoOnlyFormats[0],
      // Formato de resolución media
      videoOnlyFormats.find((f) => f.height >= 480 && f.height < 720) || videoOnlyFormats[1],
      // Formato de baja resolución
      videoOnlyFormats.find((f) => f.height < 360) || videoOnlyFormats[2]
    ]

    videoOnlyExamples.forEach((format, index) => {
      if (format) {
        console.log(`\nFormato de video #${index + 1} (${format.format_note || 'sin nota'}):`)
        console.log({
          format_id: format.format_id,
          ext: format.ext,
          vcodec: format.vcodec,
          resolution: format.resolution,
          width: format.width,
          height: format.height,
          fps: format.fps,
          tbr: format.tbr,
          vbr: format.vbr,
          filesize: format.filesize,
          filesize_approx: format.filesize_approx,
          format_note: format.format_note,
          dynamic_range: format.dynamic_range
        })
      }
    })

    console.log(`\n==== Ejemplos de formatos combinados (video + audio) ====`)
    const combinedExamples = [
      // El mejor formato combinado
      combinedFormats[0],
      // Un formato intermedio
      combinedFormats[Math.floor(combinedFormats.length / 2)],
      // El formato más bajo
      combinedFormats[combinedFormats.length - 1]
    ]

    combinedExamples.forEach((format, index) => {
      if (format) {
        console.log(`\nFormato combinado #${index + 1} (${format.format_note || 'sin nota'}):`)
        console.log({
          format_id: format.format_id,
          ext: format.ext,
          vcodec: format.vcodec,
          acodec: format.acodec,
          resolution: format.resolution,
          width: format.width,
          height: format.height,
          fps: format.fps,
          tbr: format.tbr,
          vbr: format.vbr,
          abr: format.abr,
          audio_channels: format.audio_channels,
          filesize: format.filesize,
          filesize_approx: format.filesize_approx,
          format_note: format.format_note,
          dynamic_range: format.dynamic_range
        })
      }
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

testVideoFormats()
