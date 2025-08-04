import { AssemblyAI } from 'assemblyai';
import { promises as fs } from 'fs';
import { log } from './utils.js';
import { ProgressManager } from './progress.js';

export async function transcribeAudio(
  audioFilePath: string, 
  progressManager?: ProgressManager,
  verbose: boolean = false
): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'ASSEMBLYAI_API_KEY is required. Set it as an environment variable or add it to a .env file:\n' +
      'ASSEMBLYAI_API_KEY=your_api_key_here'
    );
  }

  const client = new AssemblyAI({
    apiKey: apiKey,
  });

  try {
    progressManager?.log(`Reading audio file: ${audioFilePath}`);
    
    const audioFile = await fs.readFile(audioFilePath);
    const fileSizeMB = (audioFile.length / (1024 * 1024)).toFixed(1);
    
    // Upload phase
    if (progressManager) {
      progressManager.startPhase('Uploading to AssemblyAI');
    }
    progressManager?.log(`Uploading audio file to AssemblyAI... (${fileSizeMB} MB)`);
    
    const uploadResponse = await client.files.upload(audioFile);
    
    if (typeof uploadResponse !== 'string') {
      throw new Error('Failed to upload audio file to AssemblyAI');
    }
    
    if (progressManager) {
      progressManager.updatePhaseProgress(1, 1, `Upload complete (${fileSizeMB} MB)`);
      progressManager.completePhase();
    }
    
    // Transcription phase
    if (progressManager) {
      progressManager.startPhase('Transcribing audio');
    }
    progressManager?.log(`Audio uploaded successfully. Starting transcription...`);
    
    const transcriptRequest = {
      audio_url: uploadResponse,
      language_detection: true,
    };
    
    // Submit transcription job
    const transcriptResponse = await client.transcripts.submit(transcriptRequest);
    const transcriptId = transcriptResponse.id;
    
    progressManager?.log(`Transcription job submitted with ID: ${transcriptId}`);
    
    // Poll for completion with progress updates
    let transcript = await client.transcripts.get(transcriptId);
    const startTime = Date.now();
    let lastUpdateTime = startTime;
    
    while (transcript.status === 'queued' || transcript.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      transcript = await client.transcripts.get(transcriptId);
      const elapsed = Date.now() - startTime;
      const elapsedMinutes = (elapsed / (1000 * 60)).toFixed(1);
      
      if (progressManager) {
        // Estimate progress based on typical transcription time (roughly 0.5x real-time)
        // This is a rough estimate since AssemblyAI doesn't provide exact progress
        const estimatedTotalTime = 30000; // 30 seconds baseline for short audio
        const estimatedProgress = Math.min(90, (elapsed / estimatedTotalTime) * 100);
        
        const statusMessage = transcript.status === 'queued' ? 'In queue...' : 'Processing...';
        progressManager.updatePhaseProgress(
          estimatedProgress, 
          100, 
          `${statusMessage} (${elapsedMinutes} min elapsed)`
        );
      }
      
      // Log status every 10 seconds
      if (Date.now() - lastUpdateTime > 10000) {
        progressManager?.log(`Transcription status: ${transcript.status} (${elapsedMinutes} min elapsed)`);
        lastUpdateTime = Date.now();
      }
    }
    
    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }
    
    if (!transcript.text) {
      throw new Error('No transcript text received from AssemblyAI');
    }
    
    if (progressManager) {
      progressManager.updatePhaseProgress(100, 100, 'Transcription complete');
      progressManager.completePhase();
    }
    
    const totalElapsed = ((Date.now() - startTime) / (1000 * 60)).toFixed(1);
    progressManager?.log(`Transcription completed successfully in ${totalElapsed} minutes. Length: ${transcript.text.length} characters`);
    
    return transcript.text;
    
  } catch (error) {
    throw new Error(`AssemblyAI transcription failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}