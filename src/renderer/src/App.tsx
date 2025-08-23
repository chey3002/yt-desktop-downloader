/**
 * App refactorizado que utiliza componentes modulares
 */
import React, { useState, useEffect } from 'react';
import './assets/main.css';
import toast, { Toaster } from 'react-hot-toast';
import { Grid } from 'react-loader-spinner';
import { FormatList } from './interfaces/video.interfaces';

// Componentes
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import VideoPreview from './components/VideoPreview';
import FormatSelector from './components/FormatSelector';
import DownloadStatus from './components/DownloadStatus';
import DownloadResult from './components/DownloadResult';
import Footer from './components/Footer';

/**
 * Componente principal de la aplicación
 */
const App: React.FC = () => {
  // Estado para URL del video
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  // Estado para la lista de formatos disponibles
  const [formatList, setFormatList] = useState<FormatList | null>(null);
  
  // Estado para los formatos seleccionados
  const [selectedVideoItag, setSelectedVideoItag] = useState<string | null>(null);
  const [selectedAudioItag, setSelectedAudioItag] = useState<string | null>(null);
  
  // Estado para la descarga
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);

  /**
   * Configuración de notificaciones
   */
  const videoSuccess = () => toast.success('¡Video descargado exitosamente!', { id: Date.now().toString() });
  const videoError = () => toast.error('Error al descargar el video', { id: Date.now().toString() });

  /**
   * Manejador para buscar información del video
   */
  const handleSearch = async () => {
    if (!videoUrl || !videoUrl.trim()) {
      toast.error('Por favor ingresa una URL válida');
      return;
    }
    
    setLoading(true);
    window.electron.ipcRenderer.send('send-url', videoUrl);
  };

  /**
   * Efecto para configurar los listeners de IPC
   */
  useEffect(() => {
    // Listener para respuesta de búsqueda de URL
    const urlReplyHandler = (_: any, arg: FormatList) => {
      setLoading(false);
      setFormatList(arg);
    };
    
    // Listener para progreso de descarga
    const progressHandler = (_: any, arg: number) => {
      setProgress(arg);
    };
    
    // Listener para respuesta de descarga
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
    
    // Listener para respuesta de descarga personalizada
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

    // Registrar los listeners
    window.electron.ipcRenderer.on('send-url-reply', urlReplyHandler);
    window.electron.ipcRenderer.on('download-progress', progressHandler);
    window.electron.ipcRenderer.on('download-reply', downloadReplyHandler);
    window.electron.ipcRenderer.on('download-custom-reply', customDownloadReplyHandler);

    // Limpiar los listeners al desmontar
    return () => {
      window.electron.ipcRenderer.removeAllListeners('send-url-reply');
      window.electron.ipcRenderer.removeAllListeners('download-progress');
      window.electron.ipcRenderer.removeAllListeners('download-reply');
      window.electron.ipcRenderer.removeAllListeners('download-custom-reply');
    };
  }, []);

  /**
   * Manejador de descarga
   */
  const handleDownload = () => {
    // La lógica de descarga se maneja en el componente FormatSelector
  };

  return (
    <>
      <div className="bg-gradient-to-r from-violet-900 to-blue-950 flex flex-col justify-center items-center min-h-screen text-white">
        {/* Componente de carga */}
        {loading && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-black p-4 rounded shadow-lg flex justify-center items-center">
              <Grid color="#FF10F0" height={80} width={80} />
            </div>
          </div>
        )}
        
        {/* Encabezado de la aplicación */}
        <Header />
        
        {/* Barra de búsqueda */}
        <SearchBar 
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          onSearch={handleSearch}
        />
        
        {formatList !== null && (
          <div>
            {/* Vista previa del video */}
            <VideoPreview url={formatList.url} />
            
            {/* Selector de formatos */}
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
        
        {/* Estado de la descarga */}
        <DownloadStatus 
          isLoading={loading}
          progress={progress}
        />
        
        {/* Resultado de la descarga */}
        <DownloadResult 
          downloadComplete={downloadComplete}
          downloadPath={downloadPath}
        />
      </div>
      
      {/* Sistema de notificaciones */}
      <Toaster position="bottom-center" reverseOrder={false} />
      
      {/* Pie de página */}
      <Footer />
    </>
  )
}

export default App
