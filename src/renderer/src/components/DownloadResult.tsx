/**
 * Component to display download result messages
 */
import React from 'react';

interface DownloadResultProps {
    downloadComplete: boolean;
    downloadPath: string | null;
}

/**
 * Component that displays the result of a completed download
 */
const DownloadResult: React.FC<DownloadResultProps> = ({ downloadComplete, downloadPath }) => {
    if (!downloadComplete || !downloadPath) return null;

    /**
     * Opens the downloaded file using Electron
     */
    const openFile = () => {
        if (downloadPath) {
            window.electron.ipcRenderer.send('open-file', downloadPath);
        }
    };

    /**
     * Opens the location of the downloaded file using Electron
     */
    const openFolder = () => {
        if (downloadPath) {
            window.electron.ipcRenderer.send('open-folder', downloadPath);
        }
    };

    return (
        <div className="mt-4 text-center">
            <p className="text-green-500 font-semibold mb-2">
                Download completed successfully!
            </p>
            <p className="mb-4">
                File saved at: <span className="font-mono text-sm">{downloadPath}</span>
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={openFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Open File
                </button>
                <button
                    onClick={openFolder}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                    Open Folder
                </button>
            </div>
        </div>
    );
};

export default DownloadResult;
