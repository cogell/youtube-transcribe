import ytdl from '@distube/ytdl-core';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { validateYouTubeUrl, log, writeTranscript } from './utils.js';
import { transcribeAudio } from './transcription.js';

interface VideoInfo {
  title: string;
  videoId: string;
  duration: string;
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const info = await ytdl.getInfo(url);
  const videoDetails = info.videoDetails;
  
  return {
    title: videoDetails.title,
    videoId: videoDetails.videoId,
    duration: videoDetails.lengthSeconds
  };
}

export async function downloadAudio(url: string, outputPath: string, verbose: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    log(`Downloading audio from YouTube...`, verbose);
    
    const audioStream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    const writeStream = createWriteStream(outputPath);
    
    audioStream.pipe(writeStream);
    
    audioStream.on('error', (error: Error) => {
      reject(new Error(`Failed to download audio: ${error.message}`));
    });
    
    writeStream.on('error', (error: Error) => {
      reject(new Error(`Failed to write audio file: ${error.message}`));
    });
    
    writeStream.on('finish', () => {
      log(`Audio downloaded to: ${outputPath}`, verbose);
      resolve();
    });
  });
}

export async function transcribeYouTubeVideo(
  url: string, 
  outputDir: string = '.', 
  verbose: boolean = false
): Promise<void> {
  if (!validateYouTubeUrl(url)) {
    throw new Error('Invalid YouTube URL format');
  }

  log(`Validating YouTube URL: ${url}`, verbose);

  try {
    const videoInfo = await getVideoInfo(url);
    log(`Video title: ${videoInfo.title}`, verbose);
    log(`Video duration: ${videoInfo.duration} seconds`, verbose);

    const tempAudioPath = path.join(process.cwd(), `temp_audio_${videoInfo.videoId}.mp4`);
    
    try {
      await downloadAudio(url, tempAudioPath, verbose);
      
      log(`Starting transcription with AssemblyAI...`, verbose);
      const transcript = await transcribeAudio(tempAudioPath, verbose);
      
      const outputPath = await writeTranscript(outputDir, videoInfo.title, transcript);
      log(`Transcript saved to: ${outputPath}`, verbose);
      
    } finally {
      try {
        await fs.unlink(tempAudioPath);
        log(`Cleaned up temporary file: ${tempAudioPath}`, verbose);
      } catch (cleanupError) {
        log(`Warning: Could not clean up temporary file: ${tempAudioPath}`, verbose);
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to process YouTube video: ${error instanceof Error ? error.message : String(error)}`);
  }
}