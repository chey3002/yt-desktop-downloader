import { useState } from 'react'
import './assets/main.css'
import YtLogo from './components/ytLogo'

const App = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [formatlist, setFormatList] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState(null)

  const handleDownload = async () => {
    console.log(videoUrl)
    window.electron.ipcRenderer.send('send-url', videoUrl)
    window.electron.ipcRenderer.on('send-url-reply', (event, arg) => {
      setFormatList(arg)
      setVideoUrl('')
      setSelectedFormat(arg.info[0])
    })
  }

  return (
    <>
      <div className="bg-gradient-to-r from-violet-900 to-blue-950 flex flex-col justify-center items-center min-h-screen text-white">
        <div className="flex flex-col justify-center items-center">
          <div className="mb-8">
            <YtLogo height="150" width="500" />
          </div>
          <h1 className="text-4xl font-bold mb-12">Desktop Downloader</h1>
        </div>
        <div className="flex flex-row items-center mb-8 ">
          <input
            type="text"
            placeholder="Url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className=" outline-none p-2 bg-blue-800 border-2 border-gray-500 focus:border-white hover:border-white rounded-md mr-4 w-64"
          />
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Search
          </button>
        </div>
        {formatlist !== null && (
          <div>
            <div className="my-4">
              <iframe width="570" height="320" src={`${formatlist.url}`} title="video" />
            </div>
            <div className="flex justify-center items-center">
              <select
                onChange={(e) => setSelectedFormat(formatlist.info[e.target.value])}
                className="bg-white text-black rounded shadow mr-4 w-64"
              >
                {formatlist?.info.map((format, index) => (
                  <option key={index} value={index}>
                    {format.mimeType.split(';')[0].split('/')[1] + '  '}
                    {format.hasVideo ? '📽️' : ''}
                    {format.hasAudio ? '🎧 ' : ' '}
                    {format.qualityLabel ? format.qualityLabel : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedFormat) {
                    window.open(selectedFormat.url)
                  }
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 right-0 p-4 text-gray-600">
        <div>Created by SrChey</div>
      </div>
    </>
  )
}

export default App
