import ytdl from '@distube/ytdl-core';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { validateYouTubeUrl, log, writeTranscript } from './utils.js';
import { transcribeAudio } from './transcription.js';
import { ProgressManager } from './progress.js';

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

export async function downloadAudio(
  url: string, 
  outputPath: string, 
  progressManager?: ProgressManager,
  verbose: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    log(`Downloading audio from YouTube...`, verbose);
    
    const audioStream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    const writeStream = createWriteStream(outputPath);
    
    let downloadedBytes = 0;
    let totalBytes = 0;
    let startTime = Date.now();
    
    // Track download progress
    audioStream.on('response', (res) => {
      const contentLength = res.headers['content-length'];
      if (contentLength) {
        totalBytes = parseInt(contentLength, 10);
      }
    });
    
    audioStream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      
      if (progressManager && totalBytes > 0) {
        const elapsed = Date.now() - startTime;
        const speed = downloadedBytes / (elapsed / 1000); // bytes per second
        const speedFormatted = formatBytes(speed) + '/s';
        
        progressManager.updatePhaseProgress(
          downloadedBytes,
          totalBytes,
          `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`,
          speedFormatted
        );
      }
    });
    
    audioStream.pipe(writeStream);
    
    audioStream.on('error', (error: Error) => {
      reject(new Error(`Failed to download audio: ${error.message}`));
    });
    
    writeStream.on('error', (error: Error) => {
      reject(new Error(`Failed to write audio file: ${error.message}`));
    });
    
    writeStream.on('finish', () => {
      if (progressManager) {
        progressManager.completePhase();
      }
      log(`Audio downloaded to: ${outputPath}`, verbose);
      resolve();
    });
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function transcribeYouTubeVideo(
  url: string, 
  outputDir: string = '.', 
  verbose: boolean = false,
  progressManager?: ProgressManager
): Promise<void> {
  if (!validateYouTubeUrl(url)) {
    throw new Error('Invalid YouTube URL format');
  }

  progressManager?.log(`Validating YouTube URL: ${url}`);

  try {
    const videoInfo = await getVideoInfo(url);
    progressManager?.log(`Video title: ${videoInfo.title}`);
    progressManager?.log(`Video duration: ${videoInfo.duration} seconds`);

    const tempAudioPath = path.join(process.cwd(), `temp_audio_${videoInfo.videoId}.mp4`);
    
    try {
      // Start download phase
      if (progressManager) {
        progressManager.startPhase('Downloading audio');
      }
      await downloadAudio(url, tempAudioPath, progressManager, verbose);
      
      // Start transcription phase
      progressManager?.log(`Starting transcription with AssemblyAI...`);
      const transcript = await transcribeAudio(tempAudioPath, progressManager, verbose);
      
      // Start saving phase
      if (progressManager) {
        progressManager.startPhase('Saving transcript');
      }
      const outputPath = await writeTranscript(outputDir, videoInfo.title, transcript);
      if (progressManager) {
        progressManager.updatePhaseProgress(1, 1, `Saved to: ${path.basename(outputPath)}`);
        progressManager.completePhase();
      }
      progressManager?.log(`Transcript saved to: ${outputPath}`);
      
    } finally {
      try {
        await fs.unlink(tempAudioPath);
        progressManager?.log(`Cleaned up temporary file: ${tempAudioPath}`);
      } catch (cleanupError) {
        progressManager?.log(`Warning: Could not clean up temporary file: ${tempAudioPath}`);
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to process YouTube video: ${error instanceof Error ? error.message : String(error)}`);
  }
}