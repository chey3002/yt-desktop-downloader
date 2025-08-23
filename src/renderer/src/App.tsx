/* eslint-disable prettier/prettier */
import { useState } from 'react'
import './assets/main.css'
import YtLogo from './components/ytLogo'
// eslint-disable-next-line no-unused-vars
import toast, { Toaster } from 'react-hot-toast'
import { Grid } from 'react-loader-spinner'

interface FormatInfo {
    itag: number;
    container: string;
    qualityLabel?: string;
    mimeType: string;
    fps?: number;
    codecs: string;
    audioQuality?: string;
    bitrate?: number;
    hasVideo: boolean;
    hasAudio: boolean;
}

interface FormatList {
    url: string;
    info: FormatInfo[];
}

const App = () => {
    const [videoUrl, setVideoUrl] = useState('')
    const [formatlist, setFormatList] = useState<FormatList | null>(null)
    const [selectedVideoItag, setSelectedVideoItag] = useState<string | null>(null)
    const [selectedAudioItag, setSelectedAudioItag] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const videoSuccess = () => toast.success('Video downloaded successfully', { id: Date.now().toString() })
    const videoError = () => toast.error('Error downloading video', { id: Date.now().toString() })

    const handleSearch = async () => {
        console.log(videoUrl)
        window.electron.ipcRenderer.send('send-url', videoUrl)
        window.electron.ipcRenderer.on('send-url-reply', (_, arg) => {
            setFormatList(arg as FormatList)
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
                        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                            {/* Selector de calidad de video */}
                            <div>
                                <label className="block mb-1">Max Quality</label>
                                <select
                                    onChange={(e) => setSelectedVideoItag(e.target.value)}
                                    className="bg-white text-black rounded shadow mr-4 w-64"
                                    value={selectedVideoItag || ''}
                                >
                                    <option value="">Max Quality</option>
                                    {[...new Map(
                                        (formatlist?.info || [])
                                            .filter((f) => f.hasVideo && !f.hasAudio)
                                            .map((f) => [
                                                `${f.qualityLabel || f.mimeType}|${f.fps || ''}|${f.container || ''}|${f.codecs || ''}`,
                                                f
                                            ])
                                    ).values()].map((format) => (
                                        <option key={format.itag} value={format.itag}>
                                            {format.qualityLabel || format.mimeType} | {format.fps ? `${format.fps}fps` : ''} | {format.container} | {format.codecs}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Selector de calidad de audio */}
                            <div>
                                <label className="block mb-1">Audio Quality</label>
                                <select
                                    onChange={(e) => setSelectedAudioItag(e.target.value)}
                                    className="bg-white text-black rounded shadow w-64"
                                    value={selectedAudioItag || ''}
                                >
                                    <option value="">Max Quality</option>
                                    {[...new Map(
                                        (formatlist?.info || [])
                                            .filter((f) => !f.hasVideo && f.hasAudio)
                                            .map((f) => [
                                                `${f.audioQuality || f.mimeType}|${f.container || ''}|${f.codecs || ''}|${f.bitrate || ''}`,
                                                f
                                            ])
                                    ).values()].map((format) => (
                                        <option key={format.itag} value={format.itag}>
                                            {format.audioQuality || format.mimeType} | {format.container} | {format.codecs} | {format.bitrate ? `${(format.bitrate / 1000).toFixed(0)}kbps` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={async () => {
                                    // Si ambos selectores están en valor por defecto, descargar máxima calidad
                                    if (!selectedVideoItag && !selectedAudioItag) {
                                        setLoading(true)
                                        window.electron.ipcRenderer.send('download', videoUrl)
                                        window.electron.ipcRenderer.once('download-reply', (_, arg) => {
                                            setLoading(false)
                                            if (arg === 'success') {
                                                videoSuccess()
                                            } else {
                                                videoError()
                                            }
                                        })
                                        return
                                    }
                                    if (selectedVideoItag && selectedAudioItag) {
                                        setLoading(true)
                                        window.electron.ipcRenderer.send('download-custom', {
                                            url: videoUrl,
                                            videoItag: selectedVideoItag,
                                            audioItag: selectedAudioItag
                                        })
                                        window.electron.ipcRenderer.once('download-custom-reply', (_, arg) => {
                                            setLoading(false)
                                            if (arg === 'success') {
                                                videoSuccess()
                                            } else {
                                                videoError()
                                            }
                                        })
                                    } else {
                                        toast.error('Select both audio and video quality')
                                    }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Download
                            </button>
                        </div>

                    </div>
                )}
            </div>
            <Toaster position="bottom-center" reverseOrder={false} />
            <div className="fixed bottom-0 right-0 p-4 text-gray-600">
                <div>Created by SrChey</div>
            </div>
        </>
    )
}

export default App
