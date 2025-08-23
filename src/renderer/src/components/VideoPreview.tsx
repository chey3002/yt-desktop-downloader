/**
 * Component to display video preview
 */
import React from 'react';

interface VideoPreviewProps {
    url: string;
}

/**
 * Displays a video preview using a YouTube iframe
 */
const VideoPreview: React.FC<VideoPreviewProps> = ({ url }) => {
    return (
        <div className="my-4">
            <iframe
                width="570"
                height="320"
                src={url}
                title="Video preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
};

export default VideoPreview;
