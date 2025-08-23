/**
 * Handler for IPC events related to videos
 */
import { IpcMainEvent, app } from 'electron';
import path from 'path';
import { 
  downloadVideoAndAudio, 
  downloadCustomVideoAndAudio, 
  getVideoFormats 
} from '../services/video-service';
import { combineVideoAndAudio } from '../services/ffmpeg-service';
import { cleanStrings } from '../utils/string-utils';
import { CustomDownloadData } from '../interfaces/video.interfaces';

/**
 * Handles the request to download a video in maximum quality
 * 
 * @param event - IPC event
 * @param url - YouTube video URL
 */
export async function handleDownloadRequest(event: IpcMainEvent, url: string): Promise<void> {
  try {
    const outputPath = app.getPath('downloads');
    
    // Download the video and audio, then combine them
    // Pass the event to notify progress
    await downloadAndCombine(url, outputPath, event);
    
    // Notify success to renderer
    event.reply('download-reply', 'success');
  } catch (error) {
    // Notify error to renderer
    event.reply('download-reply', 'error');
    console.error('Error in handleDownloadRequest:', error);
  }
}

/**
 * Handles the request to get information about available formats
 * 
 * @param event - IPC event
 * @param url - YouTube video URL
 */
export async function handleSendUrlRequest(event: IpcMainEvent, url: string): Promise<void> {
  try {
    // Get available video formats
    const formatData = await getVideoFormats(url);
    
    // Send data to renderer
    event.reply('send-url-reply', formatData);
  } catch (error) {
    console.error('Error in handleSendUrlRequest:', error);
    event.reply('send-url-reply', { error: 'Error processing URL' });
    throw error;
  }
}

/**
 * Handles the request to download a video with specific formats
 * 
 * @param event - IPC event
 * @param data - Request data (URL and formats)
 */
export async function handleCustomDownloadRequest(
  event: IpcMainEvent, 
  data: CustomDownloadData
): Promise<void> {
  try {
    const { url, videoItag, audioItag } = data;
    const outputPath = app.getPath('downloads');
    
    // Perform the download with the custom formats
    // Pass the event to notify progress
    await downloadAndCombineCustom(url, videoItag, audioItag, outputPath, event);
    
    // Notify success to renderer
    event.reply('download-custom-reply', 'success');
  } catch (error) {
    // Notify error to renderer
    event.reply('download-custom-reply', 'error');
    console.error('Error in handleCustomDownloadRequest:', error);
  }
}

/**
 * Downloads and combines a video in the highest available quality
 * 
 * @param videoUrl - Video URL
 * @param outputPath - Path to save the final file
 * @param event - IPC event to send progress updates
 */
async function downloadAndCombine(videoUrl: string, outputPath: string, event?: IpcMainEvent): Promise<void> {
  // Download video and audio with progress notification
  const { videoPath, audioPath, name, author } = await downloadVideoAndAudio(videoUrl, event);
  
  // Create clean filename
  const outputName = cleanStrings(name) + ' - ' + cleanStrings(author) + '.mp4';
  const finalOutputPath = path.join(outputPath, outputName);
  
  // Combine the files with progress notification
  await combineVideoAndAudio(videoPath, audioPath, finalOutputPath, event);
}

/**
 * Downloads and combines a video using specific formats
 * 
 * @param videoUrl - Video URL
 * @param videoItag - Video format ID
 * @param audioItag - Audio format ID
 * @param outputPath - Path to save the final file
 * @param event - IPC event to send progress updates
 */
async function downloadAndCombineCustom(
  videoUrl: string,
  videoItag: string,
  audioItag: string,
  outputPath: string,
  event?: IpcMainEvent
): Promise<void> {
  // Download video and audio with specific formats
  const { videoPath, audioPath, title, author } = await downloadCustomVideoAndAudio(
    videoUrl, 
    videoItag, 
    audioItag,
    event
  );
  
  // Create clean filename
  const outputName =
    cleanStrings(title) +
    ' - ' +
    cleanStrings(author) +
    ' (custom).mp4';
  const finalOutput = path.join(outputPath, outputName);
  
  // Combine the files with progress notification
  await combineVideoAndAudio(videoPath, audioPath, finalOutput, event);
}
