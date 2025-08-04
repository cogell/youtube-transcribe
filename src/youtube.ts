import * as youtubedlModule from 'youtube-dl-exec';
const youtubedl = (youtubedlModule as any).default || youtubedlModule;

// Configure youtube-dl-exec to use system yt-dlp binary
// Try to detect yt-dlp in common locations
import { execSync } from 'child_process';

let ytdlpBinaryPath: string;
try {
  // Try to find yt-dlp using 'which' command
  ytdlpBinaryPath = execSync('which yt-dlp', { encoding: 'utf8' }).trim();
} catch {
  // Fallback to common paths
  const commonPaths = [
    '/opt/homebrew/bin/yt-dlp',  // Homebrew on Apple Silicon
    '/usr/local/bin/yt-dlp',     // Homebrew on Intel Mac
    '/usr/bin/yt-dlp',           // System install on Linux/Mac
    'yt-dlp'                     // Just try the command directly
  ];
  ytdlpBinaryPath = commonPaths.find(path => path) || 'yt-dlp'; // Default fallback
}

const ytdlp = youtubedl.create(ytdlpBinaryPath);
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { validateYouTubeUrl, log, writeTranscript, copyAudioFile } from './utils.js';
import { transcribeAudio } from './transcription.js';
import { ProgressManager } from './progress.js';

interface VideoInfo {
  title: string;
  videoId: string;
  duration: string;
  language?: string;
  availableLanguages?: string[] | undefined;
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  let info: any;
  
  try {
    info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      // Best practices for avoiding detection and rate limiting
      limitRate: '500K', // Cap at 500 KB/s per connection
      concurrentFragments: 1, // Single fragment at a time
      addHeader: [
        'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ],
      continue: true, // Resume incomplete downloads
      retries: 3, // Retry failed downloads
      sleepRequests: 1 // Sleep between requests
    });
    
  } catch (error) {
    // Handle common yt-dlp binary issues
    if (error instanceof Error && (
      error.message.includes('ENOENT') || 
      (error as any).code === 'ENOENT' ||
      (error as any).errno === -2
    )) {
      throw new Error(
        'yt-dlp binary not found. Please install yt-dlp manually using: pip install yt-dlp\n' +
        'Or ensure Python 3.7+ is installed and available in your PATH.'
      );
    }
    
    // If error has no message, create a helpful one
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage || errorMessage.trim() === '') {
      throw new Error(
        'Unknown error occurred while getting video info. This might be due to:\n' +
        '1. yt-dlp binary not installed (run: pip install yt-dlp)\n' +
        '2. Network connectivity issues\n' +
        '3. Invalid YouTube URL\n' +
        `Original error: ${JSON.stringify(error, null, 2)}`
      );
    }
    
    throw error;
  }
  
  // Extract language information from video metadata
  const detectedLanguage = 'en'; // Default to English
  
  // Get available audio languages from formats
  const audioFormats = info.formats?.filter((format: any) => 
    format.acodec && format.acodec !== 'none' && 
    (!format.vcodec || format.vcodec === 'none')
  ) || [];
  
  const availableLanguages: string[] = [];
  
  // Extract language information from format properties
  audioFormats.forEach((format: any) => {
    if (format.language) {
      availableLanguages.push(format.language);
    }
  });
  
  const uniqueLanguages = [...new Set(availableLanguages)].filter(lang => typeof lang === 'string');
  
  return {
    title: info.title || 'Unknown Title',
    videoId: info.id || extractVideoIdFromUrl(url),
    duration: info.duration?.toString() || '0',
    language: detectedLanguage,
    availableLanguages: uniqueLanguages.length > 0 ? uniqueLanguages : undefined
  };
}

function extractVideoIdFromUrl(url: string): string {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  if (!match || !match[1]) {
    throw new Error('Invalid YouTube URL: Could not extract video ID');
  }
  return match[1];
}

// Format selection is now handled by yt-dlp internally using format selectors
// These functions are no longer needed as yt-dlp provides more robust format selection

export async function downloadAudio(
  url: string, 
  outputPath: string, 
  progressManager?: ProgressManager,
  verbose: boolean = false,
  preferredLanguage?: string
): Promise<void> {
  try {
    log(`Downloading audio from YouTube using yt-dlp...`, verbose);
    
    // Extract base path without extension for yt-dlp output
    const tempAudioBase = outputPath.replace(/\.[^/.]+$/, ""); // Remove extension
    
    // Build format selector based on language preference
    // Use 'worstaudio' for smaller files while maintaining decent quality for transcription
    let formatSelector = 'worstaudio[abr>=64]/bestaudio[abr<=128]/bestaudio';
    if (preferredLanguage) {
      // Try to get audio in preferred language first, fallback to lower quality audio
      // Handle both 'en' and 'en-US' style language codes
      const langVariants = preferredLanguage === 'en' ? 
        `worstaudio[language^=en][abr>=64]/bestaudio[language^=en][abr<=128]/worstaudio[abr>=64]/bestaudio[abr<=128]/bestaudio` : 
        `worstaudio[language=${preferredLanguage}][abr>=64]/bestaudio[language=${preferredLanguage}][abr<=128]/worstaudio[language^=${preferredLanguage}][abr>=64]/bestaudio[language^=${preferredLanguage}][abr<=128]/worstaudio[abr>=64]/bestaudio[abr<=128]/bestaudio`;
      formatSelector = langVariants;
    }
    
    log(`Using format selector: ${formatSelector}`, verbose);
    
    // Get video info first to show available formats in debug mode
    if (verbose) {
      try {
        const info = await ytdlp(url, {
          dumpSingleJson: true,
          noWarnings: true,
          noCheckCertificates: true,
          limitRate: '500K',
          concurrentFragments: 1,
          addHeader: [
            'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          ],
          retries: 3,
          sleepRequests: 1
        });
        
        const audioFormats = info.formats?.filter((format: any) => 
          format.acodec && format.acodec !== 'none' && 
          (!format.vcodec || format.vcodec === 'none')
        ) || [];
        
        log(`\n=== DEBUG: Available Audio Formats ===`, true);
        audioFormats.slice(0, 10).forEach((format: any, index: number) => {
          log(`Format ${index + 1}:`, true);
          log(`  format_id: ${format.format_id}`, true);
          log(`  ext: ${format.ext}`, true);
          log(`  acodec: ${format.acodec}`, true);
          log(`  abr: ${format.abr} kbps`, true);
          log(`  language: ${format.language || 'not specified'}`, true);
          log(`  filesize: ${format.filesize || 'unknown'}`, true);
          log(`  ---`, true);
        });
        log(`Total audio formats found: ${audioFormats.length}`, true);
        log(`Preferred language: ${preferredLanguage || 'none specified'}`, true);
        log(`=======================================\n`, true);
      } catch (infoError) {
        log(`Could not get detailed format info: ${infoError}`, verbose);
      }
    }
    
    // Download audio using yt-dlp with simplified options
    const result = await ytdlp(url, {
      // Audio extraction options
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: '5', // Lower quality for smaller files (0=best, 9=worst, 5=good balance for transcription)
      format: formatSelector,
      
      // Output options (yt-dlp will add the .mp3 extension)
      output: tempAudioBase,
      
      // Basic anti-detection measures
      limitRate: '500K',
      retries: 3,
      noCheckCertificates: true
    });
    
    if (progressManager) {
      // Since we can't easily track real progress with youtube-dl-exec,
      // we'll simulate progress completion
      progressManager.updatePhaseProgress(1, 1, 'Download completed');
      progressManager.completePhase();
    }
    
    log(`Audio downloaded successfully to: ${outputPath}`, verbose);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Provide more helpful error messages for common issues
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      throw new Error(
        `Failed to download audio: YouTube blocked the request (HTTP 403 Forbidden). ` +
        `This is often caused by YouTube's bot detection systems. The yt-dlp tool ` +
        `includes anti-detection measures, but YouTube may still block some requests. ` +
        `Try again later or use a different video URL.`
      );
    } else if (errorMessage.includes('Private video') || errorMessage.includes('unavailable')) {
      throw new Error(
        `Failed to download audio: The video is private, unavailable, or restricted. ` +
        `Please check the video URL and ensure it's publicly accessible.`
      );
    } else if (errorMessage.includes('format')) {
      throw new Error(
        `Failed to download audio: Could not find suitable audio format. ` +
        `The video may not have audio tracks in the requested language (${preferredLanguage || 'default'}).`
      );
    } else {
      throw new Error(`Failed to download audio: ${errorMessage}`);
    }
  }
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
  progressManager?: ProgressManager,
  preferredLanguage?: string,
  debugOnly: boolean = false
): Promise<void> {
  if (!validateYouTubeUrl(url)) {
    throw new Error('Invalid YouTube URL format');
  }

  progressManager?.log(`Validating YouTube URL: ${url}`);

  try {
    const videoInfo = await getVideoInfo(url);
    progressManager?.log(`Video title: ${videoInfo.title}`);
    progressManager?.log(`Video duration: ${videoInfo.duration} seconds`);
    
    // Use preferred language or fall back to detected language
    const languageToUse = preferredLanguage || videoInfo.language;
    if (languageToUse) {
      progressManager?.log(`Using language preference: ${languageToUse}`);
    }
    if (videoInfo.availableLanguages?.length) {
      progressManager?.log(`Available audio languages: ${videoInfo.availableLanguages.join(', ')}`);
    }

    const tempAudioBase = path.join(process.cwd(), `temp_audio_${videoInfo.videoId}`);
    const tempAudioPath = `${tempAudioBase}.mp3`; // yt-dlp will create this
    
    
    try {
      // Start download phase
      if (progressManager) {
        progressManager.startPhase('Downloading audio');
      }
      await downloadAudio(url, tempAudioPath, progressManager, verbose, languageToUse);
      
      // If debug-only mode, stop after download
      if (debugOnly) {
        const fileStats = await fs.stat(tempAudioPath);
        const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
        progressManager?.log(`\n=== DEBUG MODE: Audio downloaded successfully ===`);
        progressManager?.log(`Audio file location: ${tempAudioPath}`);
        progressManager?.log(`Audio file size: ${fileSizeMB} MB`);
        progressManager?.log(`\nYou can now listen to this audio file to verify it's the correct language.`);
        progressManager?.log(`⚠️  Audio file will NOT be cleaned up in debug mode.`);
        progressManager?.log(`Debug complete - stopping before transcription.`);
        return;
      }
      
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
      
      // Save audio file to same directory as transcript
      if (progressManager) {
        progressManager.startPhase('Saving audio file');
      }
      const transcriptDir = path.dirname(outputPath);
      const audioOutputPath = await copyAudioFile(tempAudioPath, transcriptDir);
      if (progressManager) {
        progressManager.updatePhaseProgress(1, 1, `Audio saved to: ${path.basename(audioOutputPath)}`);
        progressManager.completePhase();
      }
      progressManager?.log(`Audio file saved to: ${audioOutputPath}`);
      
    } finally {
      // Skip cleanup in debug mode so user can listen to the audio file
      if (!debugOnly) {
        try {
          await fs.unlink(tempAudioPath);
          progressManager?.log(`Cleaned up temporary file: ${tempAudioPath}`);
        } catch (cleanupError) {
          progressManager?.log(`Warning: Could not clean up temporary file: ${tempAudioPath}`);
        }
      }
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process YouTube video: ${errorMessage || 'Unknown error occurred'}`);
  }
}