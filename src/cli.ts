#!/usr/bin/env node

// import { config } from '@dotenvx/dotenvx';
import { Command } from 'commander';
import { transcribeYouTubeVideo } from './youtube.js';
import { ProgressManager } from './progress.js';

// Load environment variables from .env file if it exists
// config();

const program = new Command();

program
  .name('youtube-transcripts')
  .description('Extract transcripts from YouTube videos using AssemblyAI')
  .version('1.0.0')
  .argument('<url>', 'YouTube video URL')
  .option('-o, --output-dir <dir>', 'Output directory', '.')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-l, --language <code>', 'Preferred audio language (e.g., en, es, fr)')
  .option('--debug-only', 'Debug mode - analyze formats but don\'t download or transcribe')
  .action(async (url: string, options) => {
    let progressManager: ProgressManager | undefined;

    try {
      if (options.verbose) {
        console.log(`Processing YouTube URL: ${url}`);
        console.log(`Output directory: ${options.outputDir}`);
        if (options.language) {
          console.log(`Preferred language: ${options.language}`);
        }
        if (options.debugOnly) {
          console.log(`Debug mode: Will analyze formats only`);
        }
      }

      // Initialize progress tracking
      const phases = [
        { name: 'Downloading audio', weight: 30 },
        { name: 'Uploading to AssemblyAI', weight: 20 },
        { name: 'Transcribing audio', weight: 40 },
        { name: 'Saving transcript', weight: 5 },
        { name: 'Saving audio file', weight: 5 }
      ];

      progressManager = new ProgressManager(phases, options.verbose);

      await transcribeYouTubeVideo(url, options.outputDir, options.verbose, progressManager, options.language || 'en', options.debugOnly);

      progressManager.complete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullError = error instanceof Error ? error.stack : String(error);

      if (options.verbose) {
        console.error('Full error details:', fullError);
      }

      if (progressManager) {
        progressManager.error(errorMessage || 'Unknown error occurred');
      } else {
        console.error('❌ Error:', errorMessage || 'Unknown error occurred');
      }
      process.exit(1);
    }
  });

program.parse();