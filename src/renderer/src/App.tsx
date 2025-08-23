/**
 * Refactored App using modular components
 */
import React, { useState, useEffect } from 'react';
import './assets/main.css';
import toast, { Toaster } from 'react-hot-toast';
import { Grid } from 'react-loader-spinner';
import { FormatList } from './interfaces/video.interfaces';

// Components
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import VideoPreview from './components/VideoPreview';
import FormatSelector from './components/FormatSelector';
import DownloadStatus from './components/DownloadStatus';
import DownloadResult from './components/DownloadResult';
import Footer from './components/Footer';

/**
 * Main application component
 */
const App: React.FC = () => {
  // Video URL state
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  // Available formats list state
  const [formatList, setFormatList] = useState<FormatList | null>(null);
  
  // Selected formats state
  const [selectedVideoItag, setSelectedVideoItag] = useState<string | null>(null);
  const [selectedAudioItag, setSelectedAudioItag] = useState<string | null>(null);
  
  // Download state
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);

  /**
   * Notifications configuration
   */
  const videoSuccess = () => toast.success('Video downloaded successfully!', { id: Date.now().toString() });
  const videoError = () => toast.error('Error downloading video', { id: Date.now().toString() });

  /**
   * Handler to search for video information
   */
  const handleSearch = async () => {
    if (!videoUrl || !videoUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    setLoading(true);
    window.electron.ipcRenderer.send('send-url', videoUrl);
  };

  /**
   * Effect to configure IPC listeners
   */
  useEffect(() => {
    // Listener for URL search response
    const urlReplyHandler = (_: any, arg: FormatList) => {
      setLoading(false);
      setFormatList(arg);
    };
    
    // Listener for download progress
    const progressHandler = (_: any, arg: number) => {
      setProgress(arg);
    };
    
    // Listener for download response
    const downloadReplyHandler = (_: any, arg: string | { status: string, path: string }) => {
      setLoading(false);
      
      if (typeof arg === 'string') {
        if (arg === 'success') {
          videoSuccess();
          setDownloadComplete(true);
        } else {
          videoError();
        }
      } else {
        if (arg.status === 'success') {
          videoSuccess();
          setDownloadComplete(true);
          setDownloadPath(arg.path);
        } else {
          videoError();
        }
      }
    };
    
    // Listener for custom download response
    const customDownloadReplyHandler = (_: any, arg: string | { status: string, path: string }) => {
      setLoading(false);
      
      if (typeof arg === 'string') {
        if (arg === 'success') {
          videoSuccess();
          setDownloadComplete(true);
        } else {
          videoError();
        }
      } else {
        if (arg.status === 'success') {
          videoSuccess();
          setDownloadComplete(true);
          setDownloadPath(arg.path);
        } else {
          videoError();
        }
      }
    };

    // Register listeners
    window.electron.ipcRenderer.on('send-url-reply', urlReplyHandler);
    window.electron.ipcRenderer.on('download-progress', progressHandler);
    window.electron.ipcRenderer.on('download-reply', downloadReplyHandler);
    window.electron.ipcRenderer.on('download-custom-reply', customDownloadReplyHandler);

    // Clean up listeners when unmounting
    return () => {
      window.electron.ipcRenderer.removeAllListeners('send-url-reply');
      window.electron.ipcRenderer.removeAllListeners('download-progress');
      window.electron.ipcRenderer.removeAllListeners('download-reply');
      window.electron.ipcRenderer.removeAllListeners('download-custom-reply');
    };
  }, []);

  /**
   * Download handler
   */
  const handleDownload = () => {
    // Download logic is handled in the FormatSelector component
  };

  return (
    <>
      <div className="bg-gradient-to-r from-violet-900 to-blue-950 flex flex-col justify-center items-center min-h-screen text-white">
        {/* Loading component */}
        {loading && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-black p-4 rounded shadow-lg flex justify-center items-center">
              <Grid color="#FF10F0" height={80} width={80} />
            </div>
          </div>
        )}
        
        {/* Application header */}
        <Header />
        
        {/* Search bar */}
        <SearchBar 
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          onSearch={handleSearch}
        />
        
        {formatList !== null && (
          <div>
            {/* Video preview */}
            <VideoPreview url={formatList.url} />
            
            {/* Format selector */}
            <FormatSelector 
              formats={formatList.info}
              selectedVideoItag={selectedVideoItag}
              selectedAudioItag={selectedAudioItag}
              setSelectedVideoItag={setSelectedVideoItag}
              setSelectedAudioItag={setSelectedAudioItag}
              onDownload={handleDownload}
              videoUrl={videoUrl}
              setLoading={setLoading}
            />
          </div>
        )}
        
        {/* Download status */}
        <DownloadStatus 
          isLoading={loading}
          progress={progress}
        />
        
        {/* Download result */}
        <DownloadResult 
          downloadComplete={downloadComplete}
          downloadPath={downloadPath}
        />
      </div>
      
      {/* Notification system */}
      <Toaster position="bottom-center" reverseOrder={false} />
      
      {/* Footer */}
      <Footer />
    </>
  )
}

export default App
