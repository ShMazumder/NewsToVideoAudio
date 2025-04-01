import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

/**
 * Generate TTS audio and return duration
 * @param {string} text - Text to convert to speech
 * @param {string} outputPath - Output file path
 * @param {Object} options - Configuration options
 * @returns {Promise<{path: string, duration: number}>} - Path and duration in seconds
 */
export async function textToSpeech(text, outputPath, options = {}) {
  const { language = 'en', preferGoogle = true } = options;
  
  // Try Google Cloud TTS first if credentials exist and preferred
  if (preferGoogle && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
      const client = new TextToSpeechClient();
      
      const voiceConfig = language === 'bn' ? 
        { languageCode: 'bn-BD', name: 'bn-BD-Standard-A' } :
        { languageCode: 'en-US', name: 'en-US-News-L' };
      
      const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: voiceConfig,
        audioConfig: { audioEncoding: 'MP3' }
      });
      
      await fs.writeFile(outputPath, response.audioContent, 'binary');
      const duration = await getAudioDuration(outputPath);
      
      console.log(`🔊 Generated Google TTS (${duration.toFixed(2)}s): ${path.basename(outputPath)}`);
      return { path: outputPath, duration };
    } catch (error) {
      console.warn('❌ Google TTS failed, trying fallback:', error.message);
    }
  }

  // System TTS fallback
  try {
    let command;
    if (language === 'bn') {
      command = `espeak -v bn -s 150 "${text}" --stdout | ffmpeg -i - -ar 44100 ${outputPath}`;
    } else {
      command = `espeak -v ${language} -s 150 "${text}" --stdout > ${outputPath}`;
    }
    
    await execAsync(command);
    const duration = await getAudioDuration(outputPath);
    
    console.log(`🔊 Generated System TTS (${duration.toFixed(2)}s): ${path.basename(outputPath)}`);
    return { path: outputPath, duration };
    
  } catch (error) {
    console.error('❌ TTS generation failed:', error.message);
    await fs.writeFile(outputPath, ''); // Create empty file
    return { path: outputPath, duration: 0 };
  }
}

/**
 * Get audio file duration in seconds
 * @param {string} filePath - Path to audio file
 * @returns {Promise<number>} - Duration in seconds
 */
async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim()) || 0;
  } catch (error) {
    console.warn('⚠️ Could not determine audio duration:', error.message);
    return 0;
  }
}


// Example usage:
// English with Google TTS (default)
// await textToSpeech('Hello world', 'output-en.mp3');

// Bangla with Google TTS
// await textToSpeech('আমার সোনার বাংলা', 'output-bn.mp3', { language: 'bn' });

// English with system TTS only
// await textToSpeech('Hello world', 'output-en-fallback.mp3', { preferGoogle: false });

// Bangla with system TTS only
// await textToSpeech('আমার সোনার বাংলা', 'output-bn-fallback.mp3', { language: 'bn', preferGoogle: false });