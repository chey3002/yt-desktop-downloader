/**
 * Component to select video and audio formats
 */
import React from 'react';
import { FormatInfo } from '../interfaces/video.interfaces';
import toast from 'react-hot-toast';

interface FormatSelectorProps {
  formats: FormatInfo[];
  selectedVideoItag: string | null;
  selectedAudioItag: string | null;
  setSelectedVideoItag: (itag: string) => void;
  setSelectedAudioItag: (itag: string) => void;
  onDownload: () => void;
  videoUrl: string;
  setLoading: (loading: boolean) => void;
}

/**
 * Component to select video and audio formats and download the video
 */
const FormatSelector: React.FC<FormatSelectorProps> = ({
  formats,
  selectedVideoItag,
  selectedAudioItag,
  setSelectedVideoItag,
  setSelectedAudioItag,
  onDownload,
  videoUrl,
  setLoading
}) => {
  /**
   * Handles the download process based on user selections
   */
  const handleDownload = async () => {
    // If both selectors are at default value, download highest quality
    if (!selectedVideoItag && !selectedAudioItag) {
      setLoading(true);
      window.electron.ipcRenderer.send('download', videoUrl);
      return;
    }
    
    // If both formats (video and audio) have been selected
    if (selectedVideoItag && selectedAudioItag) {
      setLoading(true);
      window.electron.ipcRenderer.send('download-custom', {
        url: videoUrl,
        videoItag: selectedVideoItag,
        audioItag: selectedAudioItag
      });
    } else {
      toast.error('Select video and audio quality');
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
      {/* Video quality selector */}
      <div>
        <label className="block mb-1">Video Quality</label>
        <select
          onChange={(e) => setSelectedVideoItag(e.target.value)}
          className="bg-white text-black rounded shadow mr-4 w-64"
          value={selectedVideoItag || ''}
        >
          <option value="">Max Quality</option>
          {[...new Map(
            formats
              .filter((f) => f.hasVideo && !f.hasAudio)
              .map((f) => [
                `${f.qualityLabel || f.mimeType}|${f.fps || ''}|${f.container || ''}|${f.codecs || ''}`,
                f
              ])
          ).values()].map((format) => (
            <option key={format.itag} value={format.itag}>
              {format.qualityLabel || format.mimeType} | 
              {format.fps ? `${format.fps}fps` : ''} | 
              {format.container} | 
              {format.codecs}
            </option>
          ))}
        </select>
      </div>
      
      {/* Audio quality selector */}
      <div>
        <label className="block mb-1">Audio Quality</label>
        <select
          onChange={(e) => setSelectedAudioItag(e.target.value)}
          className="bg-white text-black rounded shadow w-64"
          value={selectedAudioItag || ''}
        >
          <option value="">Max Quality</option>
          {[...new Map(
            formats
              .filter((f) => !f.hasVideo && f.hasAudio)
              .map((f) => [
                `${f.audioQuality || f.mimeType}|${f.container || ''}|${f.codecs || ''}|${f.bitrate || ''}`,
                f
              ])
          ).values()].map((format) => (
            <option key={format.itag} value={format.itag}>
              {format.audioQuality || format.mimeType} | 
              {format.container} | 
              {format.codecs} | 
              {format.bitrate ? `${(format.bitrate / 1000).toFixed(0)}kbps` : ''}
            </option>
          ))}
        </select>
      </div>
      
      {/* Download button */}
      <button
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Download
      </button>
    </div>
  );
};

export default FormatSelector;
