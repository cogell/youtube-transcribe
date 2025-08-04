#!/usr/bin/env node

import { config } from 'dotenv';
import { Command } from 'commander';
import { transcribeYouTubeVideo } from './youtube.js';

// Load environment variables from .env file if it exists
config();

const program = new Command();

program
  .name('youtube-transcripts')
  .description('Extract transcripts from YouTube videos using AssemblyAI')
  .version('1.0.0')
  .argument('<url>', 'YouTube video URL')
  .option('-o, --output-dir <dir>', 'Output directory', '.')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (url: string, options) => {
    try {
      if (options.verbose) {
        console.log(`Processing YouTube URL: ${url}`);
        console.log(`Output directory: ${options.outputDir}`);
      }

      await transcribeYouTubeVideo(url, options.outputDir, options.verbose);
      
      console.log('✅ Transcription completed successfully!');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();