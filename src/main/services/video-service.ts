/**
 * Services for video management in the application
 */
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import { VideoAudioResult } from '../interfaces/video.interfaces';

/**
 * Downloads a video and its audio into separate temporary files
 * 
 * @param videoUrl - YouTube video URL to download
 * @param event - Optional IPC event to send progress updates
 * @returns An object with paths to downloaded files and metadata
 */
export async function downloadVideoAndAudio(videoUrl: string, event?: Electron.IpcMainEvent): Promise<VideoAudioResult> {
  try {
    const info = await ytdl.getInfo(videoUrl);
    
    // Filter desired video and audio formats that aren't webm
    const videoFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
      filter: (format) =>
        format.container !== 'webm' && format.hasVideo === true && format.hasAudio === false
    });
    
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: (format) =>
        format.container !== 'webm' && format.hasVideo === false && format.hasAudio === true
    });
    
    // Paths for temporary files
    const videoPath = path.join(app.getPath('downloads'), 'temp_video.mp4');
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio.aac');
    
    // Remove previous temporary files if they exist
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    // Notify audio download start (0%)
    if (event) {
      event.reply('download-progress', 0);
    }

    // Create streams for downloading
    const videoStream = ytdl(videoUrl, { format: videoFormat });
    const audioStream = ytdl(videoUrl, { format: audioFormat });

    // Download audio (10%)
    await new Promise<void>((resolve, reject) => {
      audioStream
        .pipe(fs.createWriteStream(audioPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 10);
          }
          resolve();
        })
        .on('error', reject);
    });
    
    // Download video (50% additional = 60% total)
    await new Promise<void>((resolve, reject) => {
      videoStream
        .pipe(fs.createWriteStream(videoPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 60);
          }
          resolve();
        })
        .on('error', reject);
    });

    console.log('Video and audio successfully downloaded.');

    // Return information about downloaded files
    return {
      videoPath,
      audioPath,
      name: info.videoDetails.title,
      author: info.videoDetails.author.name
    };
  } catch (error) {
    console.log('Error downloading video and audio:', error);
    throw error;
  }
}

/**
 * Downloads a video and audio using specific formats selected by the user
 * 
 * @param videoUrl - YouTube video URL
 * @param videoItag - ID of the selected video format
 * @param audioItag - ID of the selected audio format
 * @param event - Optional IPC event to send progress updates
 * @returns An object with paths to temporary files and video metadata
 */
export async function downloadCustomVideoAndAudio(
  videoUrl: string, 
  videoItag: string, 
  audioItag: string,
  event?: Electron.IpcMainEvent
): Promise<{
  videoPath: string;
  audioPath: string;
  title: string;
  author: string;
}> {
  try {
    const info = await ytdl.getInfo(videoUrl);
    
    // Find specific formats by itag
    const videoFormat = info.formats.find((f) => f.itag.toString() === videoItag.toString());
    const audioFormat = info.formats.find((f) => f.itag.toString() === audioItag.toString());
    
    // Verify that formats were found
    if (!videoFormat || !audioFormat) {
      throw new Error('Requested formats not found');
    }
    
    // Paths for temporary files
    const videoPath = path.join(app.getPath('downloads'), 'temp_video_custom.mp4');
    const audioPath = path.join(app.getPath('downloads'), 'temp_audio_custom.aac');
    
    // Remove previous temporary files if they exist
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    
    // Notify download start (0%)
    if (event) {
      event.reply('download-progress', 0);
    }
    
    // Create streams for downloading
    const videoStream = ytdl(videoUrl, { format: videoFormat });
    const audioStream = ytdl(videoUrl, { format: audioFormat });
    
    // Download audio first (10%)
    await new Promise<void>((resolve, reject) => {
      audioStream
        .pipe(fs.createWriteStream(audioPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 10);
          }
          resolve();
        })
        .on('error', reject);
    });
    
    // Then download video (50% additional = 60% total)
    await new Promise<void>((resolve, reject) => {
      videoStream
        .pipe(fs.createWriteStream(videoPath))
        .on('finish', () => {
          if (event) {
            event.reply('download-progress', 60);
          }
          resolve();
        })
        .on('error', reject);
    });
    
    return {
      videoPath,
      audioPath,
      title: info.videoDetails.title,
      author: info.videoDetails.author.name
    };
  } catch (error) {
    console.error('Error downloading custom video and audio:', error);
    throw error;
  }
}

/**
 * Gets the available formats for a YouTube video
 * 
 * @param videoUrl - YouTube video URL
 * @returns An object with the embed URL and the list of available formats
 */
export async function getVideoFormats(videoUrl: string): Promise<{
  url: string;
  info: ytdl.videoFormat[];
}> {
  try {
    const videoId = await ytdl.getURLVideoID(videoUrl);
    const metaInfo = await ytdl.getInfo(videoUrl);
    
    // Sort formats to show the most useful ones first
    const sortedInfo = metaInfo.formats.sort((a, b) => {
      const aHasVideo = a.hasVideo;
      const aHasAudio = a.hasAudio;
      const bHasVideo = b.hasVideo;
      const bHasAudio = b.hasAudio;

      // Complex sorting logic to prioritize certain formats
      if (aHasVideo && aHasAudio && !bHasVideo && !bHasAudio) {
        return -1;
      } else if (!aHasVideo && !aHasAudio && bHasVideo && bHasAudio) {
        return 1;
      } else if (aHasVideo && aHasAudio && bHasVideo && bHasAudio) {
        return 0;
      } else if (aHasVideo && aHasAudio && !bHasVideo && bHasAudio) {
        return -1;
      } else if (!aHasVideo && aHasAudio && bHasVideo && bHasAudio) {
        return 1;
      } else if (aHasVideo && !aHasAudio && bHasVideo && bHasAudio) {
        return -1;
      } else if (aHasVideo && aHasAudio && bHasVideo && !bHasAudio) {
        return -1;
      } else if (aHasVideo && !aHasAudio && !bHasVideo && bHasAudio) {
        return -1;
      } else if (!aHasVideo && aHasAudio && !bHasVideo && bHasAudio) {
        return 1;
      } else if (!aHasVideo && !aHasAudio && bHasVideo && !bHasAudio) {
        return 1;
      } else if (!aHasVideo && !aHasAudio && !bHasVideo && bHasAudio) {
        return 1;
      } else {
        return 0;
      }
    });
    
    return {
      url: 'https://www.youtube.com/embed/' + videoId,
      info: sortedInfo
    };
  } catch (error) {
    console.error('Error getting video formats:', error);
    throw error;
  }
}
