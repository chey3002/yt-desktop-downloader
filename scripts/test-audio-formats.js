const ytDlpExec = require('yt-dlp-exec')

async function testFormats() {
  try {
    console.log('Obteniendo información del video...')
    const result = await ytDlpExec('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true
    })

    console.log('Filtrando formatos de audio...')
    const audioFormats = result.formats.filter(
      (format) => format.acodec !== 'none' && format.vcodec === 'none'
    )

    console.log(`Encontrados ${audioFormats.length} formatos de audio.`)
    console.log('Propiedades de audio disponibles:')

    // Mostrar las 5 primeras entradas de audio con sus propiedades
    audioFormats.slice(0, 3).forEach((format, index) => {
      console.log(`\n==== Formato de Audio #${index + 1} ====`)
      console.log(`ID: ${format.format_id}`)
      console.log(`Extensión: ${format.ext}`)
      console.log(`Códec de audio: ${format.acodec}`)
      console.log(`Canales de audio: ${format.audio_channels || 'No especificado'}`)
      console.log(`Tasa de muestreo: ${format.asr || 'No especificado'} Hz`)
      console.log(`Tasa de bits (ABR): ${format.abr || 'No especificado'} kbps`)
      console.log(`Tasa de bits (TBR): ${format.tbr || 'No especificado'} kbps`)
      console.log(`Nota de formato: ${format.format_note || 'No especificado'}`)
      console.log(`Calidad: ${format.quality || 'No especificado'}`)
    })

    // Mostrar todas las propiedades disponibles en los formatos de audio
    console.log('\n==== Todas las propiedades disponibles en los formatos de audio ====')
    const allProperties = new Set()
    audioFormats.forEach((format) => {
      Object.keys(format).forEach((key) => allProperties.add(key))
    })

    console.log([...allProperties].sort().join(', '))
  } catch (error) {
    console.error('Error:', error)
  }
}

testFormats()
