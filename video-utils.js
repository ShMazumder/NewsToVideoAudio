import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export async function combineVideoAudio(videoPath, audioPath, outputPath) {
  try {
    // Validate input paths
    if (!videoPath || !outputPath) {
      throw new Error('Video path and output path are required');
    }

    // Check file existence
    const videoExists = await fs.pathExists(videoPath);
    const audioExists = await fs.pathExists(audioPath);

    if (!videoExists) {
      throw new Error(`Video file not found at: ${videoPath}`);
    }

    if (!audioExists) {
      console.warn(`⚠️ Audio file not found, creating video-only output`);
      await fs.copy(videoPath, outputPath);
      return {
        path: outputPath,
        audioMerged: false,
        message: 'Created video without audio'
      };
    }

    // FFmpeg command with improved settings
    const mergeCommand = [
      'ffmpeg',
      '-y', // Overwrite without asking
      '-i', `"${videoPath}"`,
      '-i', `"${audioPath}"`,
      '-c:v', 'copy', // Copy video stream without re-encoding
      '-c:a', 'aac', // Use AAC audio codec
      '-b:a', '192k', // Higher audio bitrate
      '-shortest', // Match output duration to shortest input
      `"${outputPath}"`
    ].join(' ');

    await execAsync(mergeCommand);
    
    console.log(`🎬 Successfully merged: ${path.basename(outputPath)}`);
    return {
      path: outputPath,
      audioMerged: true,
      message: 'Successfully merged video and audio'
    };
    
  } catch (error) {
    console.error(`❌ Failed to merge video and audio: ${error.message}`);
    
    // Attempt to save just the video if merging fails
    try {
      await fs.copy(videoPath, outputPath);
      console.warn(`⚠️ Saved video without audio as fallback`);
      return {
        path: outputPath,
        audioMerged: false,
        error: error.message,
        message: 'Saved video without audio after merge failure'
      };
    } catch (copyError) {
      throw new Error(`Complete failure: ${error.message} and ${copyError.message}`);
    }
  }
}