import { useState } from 'react'
import './assets/main.css'
import YtLogo from './components/ytLogo'
// eslint-disable-next-line no-unused-vars
import toast, { Toaster } from 'react-hot-toast'
import { Grid } from 'react-loader-spinner'




const App = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [formatlist, setFormatList] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [loading, setLoading] = useState(false)
  const videoSuccess = () => toast.success('Video downloaded successfully', { id: Date.now() })
  const videoError = () => toast.error('Error downloading video', { id: Date.now() })

  const handleSearch = async () => {
    console.log(videoUrl)
    window.electron.ipcRenderer.send('send-url', videoUrl)
    window.electron.ipcRenderer.on('send-url-reply', (event, arg) => {
      setFormatList(arg)
      setSelectedFormat(arg.info[0])
    })
  }
  const handleDownload = async () => {
    setLoading(true)
    console.log(videoUrl)
    window.electron.ipcRenderer.send('download', videoUrl)
    window.electron.ipcRenderer.on('download-reply', (event, arg) => {
      setLoading(false)
      console.log(arg)
      if (arg === 'success') {
        videoSuccess()
      } else {
        videoError()
      }
    })
  }

  return (
    <>
      <div className="bg-gradient-to-r from-violet-900 to-blue-950 flex flex-col justify-center items-center min-h-screen text-white">
        {loading ? (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-black p-4 rounded shadow-lg flex justify-center items-center">
              <Grid color="#FF10F0" height={80} width={80} />
            </div>
          </div>
        ) : null}
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
            onClick={handleSearch}
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
              <button
                onClick={handleDownload}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
              >
                Download Max Quality
              </button>
            </div>
          </div>
        )}
      </div>
      <Toaster position="bottom-center"
        reverseOrder={false} />
      <div className="fixed bottom-0 right-0 p-4 text-gray-600">
        <div>Created by SrChey</div>
      </div>
    </>
  )
}

export default App
