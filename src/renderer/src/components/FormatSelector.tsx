/**
 * Componente para seleccionar formatos de video y audio
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
 * Componente para seleccionar formatos de video y audio y descargar el video
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
   * Maneja el proceso de descarga según las selecciones del usuario
   */
  const handleDownload = async () => {
    // Si ambos selectores están en valor por defecto, descargar máxima calidad
    if (!selectedVideoItag && !selectedAudioItag) {
      setLoading(true);
      window.electron.ipcRenderer.send('download', videoUrl);
      return;
    }
    
    // Si se han seleccionado ambos formatos (video y audio)
    if (selectedVideoItag && selectedAudioItag) {
      setLoading(true);
      window.electron.ipcRenderer.send('download-custom', {
        url: videoUrl,
        videoItag: selectedVideoItag,
        audioItag: selectedAudioItag
      });
    } else {
      toast.error('Selecciona calidad de video y audio');
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
      {/* Selector de calidad de video */}
      <div>
        <label className="block mb-1">Calidad de Video</label>
        <select
          onChange={(e) => setSelectedVideoItag(e.target.value)}
          className="bg-white text-black rounded shadow mr-4 w-64"
          value={selectedVideoItag || ''}
        >
          <option value="">Máxima Calidad</option>
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
      
      {/* Selector de calidad de audio */}
      <div>
        <label className="block mb-1">Calidad de Audio</label>
        <select
          onChange={(e) => setSelectedAudioItag(e.target.value)}
          className="bg-white text-black rounded shadow w-64"
          value={selectedAudioItag || ''}
        >
          <option value="">Máxima Calidad</option>
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
      
      {/* Botón de descarga */}
      <button
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Descargar
      </button>
    </div>
  );
};

export default FormatSelector;
