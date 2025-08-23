/**
 * Componente para mostrar la vista previa del video
 */
import React from 'react';

interface VideoPreviewProps {
  url: string;
}

/**
 * Muestra una vista previa del video usando un iframe de YouTube
 */
const VideoPreview: React.FC<VideoPreviewProps> = ({ url }) => {
  return (
    <div className="my-4">
      <iframe 
        width="570" 
        height="320" 
        src={url}
        title="Vista previa del video" 
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPreview;
