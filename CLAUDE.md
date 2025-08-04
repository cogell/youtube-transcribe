# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript CLI tool that extracts transcripts from YouTube videos using AssemblyAI's speech-to-text API. The tool downloads audio from YouTube videos, uploads it to AssemblyAI for transcription, and saves the transcript in organized folders.

## Common Development Commands

```bash
# Development (run directly from source)
pnpm dev "https://www.youtube.com/watch?v=VIDEO_ID"

# Build the project  
pnpm build

# Run built version
pnpm start "https://www.youtube.com/watch?v=VIDEO_ID"

# Install dependencies
pnpm install
```

## Environment Setup

- Requires `ASSEMBLYAI_API_KEY` environment variable
- Uses `.env` file for local development (not committed)
- Node.js 18+ required
- Uses pnpm as package manager

## Architecture

### Core Modules

- **`src/cli.ts`** - Main CLI entry point using commander.js, orchestrates the entire workflow
- **`src/youtube.ts`** - YouTube integration using @distube/ytdl-core for audio extraction and metadata
- **`src/transcription.ts`** - AssemblyAI integration for speech-to-text processing
- **`src/utils.ts`** - Utility functions for file operations, validation, and string sanitization

### Data Flow

1. CLI validates YouTube URL and parses options
2. YouTube module extracts video metadata and downloads audio to temp file
3. Transcription module uploads audio to AssemblyAI and polls for completion
4. Utils module creates organized folder structure and saves transcript
5. Cleanup removes temporary files

### Output Structure

Creates `transcriptions/{sanitized-video-title}/transcript.txt` where video titles are converted to lowercase with hyphens replacing spaces and special characters removed.

## Key Dependencies

- **@distube/ytdl-core** - YouTube video downloading (more reliable than standard ytdl-core)
- **assemblyai** - Official AssemblyAI SDK for transcription
- **commander** - CLI argument parsing and help generation
- **dotenv** - Environment variable loading

## TypeScript Configuration

Uses strict TypeScript with ESNext modules and Node.js target. Key settings:
- `"module": "nodenext"` for proper ES module support
- `"verbatimModuleSyntax": true` for explicit import/export syntax
- Strict type checking enabled
- Source maps and declarations generated for debugging

## Error Handling Patterns

All modules use try/catch with descriptive error messages. Temporary files are always cleaned up in finally blocks. The CLI provides user-friendly error output with specific guidance for common issues like missing API keys.