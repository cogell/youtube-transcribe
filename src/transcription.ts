import { AssemblyAI } from 'assemblyai';
import { promises as fs } from 'fs';
import { log } from './utils.js';

export async function transcribeAudio(audioFilePath: string, verbose: boolean = false): Promise<string> {
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
    log(`Reading audio file: ${audioFilePath}`, verbose);
    
    const audioFile = await fs.readFile(audioFilePath);
    
    log(`Uploading audio file to AssemblyAI...`, verbose);
    
    const uploadResponse = await client.files.upload(audioFile);
    
    if (typeof uploadResponse !== 'string') {
      throw new Error('Failed to upload audio file to AssemblyAI');
    }
    
    log(`Audio uploaded successfully. Starting transcription...`, verbose);
    
    const transcriptRequest = {
      audio_url: uploadResponse,
      language_detection: true,
    };
    
    const transcript = await client.transcripts.transcribe(transcriptRequest);
    
    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }
    
    if (!transcript.text) {
      throw new Error('No transcript text received from AssemblyAI');
    }
    
    log(`Transcription completed successfully. Length: ${transcript.text.length} characters`, verbose);
    
    return transcript.text;
    
  } catch (error) {
    throw new Error(`AssemblyAI transcription failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}