/**
 * Component to display download status and progress
 */
import React from 'react';

interface DownloadStatusProps {
  isLoading: boolean;
  progress: number;
}

/**
 * Component that displays download status and a progress bar
 */
const DownloadStatus: React.FC<DownloadStatusProps> = ({ isLoading, progress }) => {
  if (!isLoading) return null;
  
  return (
    <div className="mt-4">
      <div className="flex flex-col items-center w-full">
        <div className="text-center mb-2">
          {progress === 100 
            ? 'Finalizing download and processing...' 
            : `Downloading: ${progress}%`}
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2.5 mb-4 max-w-md">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default DownloadStatus;
