import { promises as fs } from 'fs';
import path from 'path';

export function sanitizeFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function writeTranscript(outputDir: string, videoTitle: string, transcript: string): Promise<string> {
  const sanitizedTitle = sanitizeFileName(videoTitle);
  const transcriptionsDir = path.join(outputDir, 'transcriptions');
  const folderPath = path.join(transcriptionsDir, sanitizedTitle);
  const filePath = path.join(folderPath, 'transcript.txt');
  
  await ensureDirectoryExists(folderPath);
  await fs.writeFile(filePath, transcript, 'utf8');
  
  return filePath;
}

export function validateYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]{11}.*$/;
  return youtubeRegex.test(url);
}

export async function copyAudioFile(sourcePath: string, destinationDir: string, fileName: string = 'audio.mp4'): Promise<string> {
  const destinationPath = path.join(destinationDir, fileName);
  
  try {
    await fs.copyFile(sourcePath, destinationPath);
    return destinationPath;
  } catch (error) {
    throw new Error(`Failed to copy audio file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function log(message: string, verbose: boolean = false): void {
  if (verbose) {
    console.log(`🔍 ${message}`);
  }
}