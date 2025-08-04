#!/usr/bin/env node

import { config } from 'dotenv';
import { Command } from 'commander';
import { transcribeYouTubeVideo } from './youtube.js';
import { ProgressManager } from './progress.js';

// Load environment variables from .env file if it exists
config({ debug: false });

const program = new Command();

program
  .name('youtube-transcripts')
  .description('Extract transcripts from YouTube videos using AssemblyAI')
  .version('1.0.0')
  .argument('<url>', 'YouTube video URL')
  .option('-o, --output-dir <dir>', 'Output directory', '.')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (url: string, options) => {
    let progressManager: ProgressManager | undefined;
    
    try {
      if (options.verbose) {
        console.log(`Processing YouTube URL: ${url}`);
        console.log(`Output directory: ${options.outputDir}`);
      }

      // Initialize progress tracking
      const phases = [
        { name: 'Downloading audio', weight: 30 },
        { name: 'Uploading to AssemblyAI', weight: 20 },
        { name: 'Transcribing audio', weight: 45 },
        { name: 'Saving transcript', weight: 5 }
      ];
      
      progressManager = new ProgressManager(phases, options.verbose);

      await transcribeYouTubeVideo(url, options.outputDir, options.verbose, progressManager);
      
      progressManager.complete();
    } catch (error) {
      if (progressManager) {
        progressManager.error(error instanceof Error ? error.message : String(error));
      } else {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      }
      process.exit(1);
    }
  });

program.parse();