/**
 * Componente para mostrar mensajes de resultado de la descarga
 */
import React from 'react';

interface DownloadResultProps {
  downloadComplete: boolean;
  downloadPath: string | null;
}

/**
 * Componente que muestra el resultado de una descarga completada
 */
const DownloadResult: React.FC<DownloadResultProps> = ({ downloadComplete, downloadPath }) => {
  if (!downloadComplete || !downloadPath) return null;

  /**
   * Abre el archivo descargado usando Electron
   */
  const openFile = () => {
    if (downloadPath) {
      window.electron.ipcRenderer.send('open-file', downloadPath);
    }
  };

  /**
   * Abre la ubicación del archivo descargado usando Electron
   */
  const openFolder = () => {
    if (downloadPath) {
      window.electron.ipcRenderer.send('open-folder', downloadPath);
    }
  };

  return (
    <div className="mt-4 text-center">
      <p className="text-green-500 font-semibold mb-2">
        ¡Descarga completada con éxito!
      </p>
      <p className="mb-4">
        Archivo guardado en: <span className="font-mono text-sm">{downloadPath}</span>
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={openFile}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Abrir Archivo
        </button>
        <button
          onClick={openFolder}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Abrir Carpeta
        </button>
      </div>
    </div>
  );
};

export default DownloadResult;
