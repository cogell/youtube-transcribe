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

# Run with specific language preference
pnpm start "https://www.youtube.com/watch?v=VIDEO_ID" --language es

# Install dependencies
pnpm install
```

## Environment Setup

- Requires `ASSEMBLYAI_API_KEY` environment variable
- Uses `.env` file for local development (not committed)
- Node.js 18+ required
- Uses pnpm as package manager
- **NEW**: Requires yt-dlp binary (automatically downloaded by youtube-dl-exec)
- Python 3.7+ recommended for yt-dlp functionality

## Architecture

### Core Modules

- **`src/cli.ts`** - Main CLI entry point using commander.js, orchestrates the entire workflow
- **`src/youtube.ts`** - YouTube integration using youtube-dl-exec (yt-dlp wrapper) for audio extraction and metadata
- **`src/transcription.ts`** - AssemblyAI integration for speech-to-text processing
- **`src/utils.ts`** - Utility functions for file operations, validation, and string sanitization

### Data Flow

1. CLI validates YouTube URL and parses options (including language preference)
2. YouTube module extracts video metadata and analyzes available audio tracks
3. Language-aware audio format selection prioritizes preferred language (defaults to English)
4. Audio is downloaded from the selected track and saved to temp file
5. Transcription module uploads audio to AssemblyAI and polls for completion
6. Utils module creates organized folder structure and saves transcript
7. Cleanup removes temporary files

### Language Selection and Audio Quality

The tool uses yt-dlp's robust format selection to choose appropriate audio tracks with optimized quality for transcription:

- **Audio Quality**: Uses medium quality (64-128 kbps) for smaller downloads while maintaining transcription accuracy
- **Language override**: Use `--language <code>` to specify preferred language (e.g., `--language es` for Spanish)  
- **Format selection**: Uses optimized selectors like `worstaudio[abr>=64]/bestaudio[abr<=128]` for balance of size and quality
- **Smart fallback**: Automatically falls back to available audio in preferred language or best quality match

### Output Structure

Creates `transcriptions/{sanitized-video-title}/transcript.txt` where video titles are converted to lowercase with hyphens replacing spaces and special characters removed.

## Key Dependencies

- **youtube-dl-exec** - Node.js wrapper for yt-dlp, the most reliable YouTube downloader with anti-bot detection measures
- **assemblyai** - Official AssemblyAI SDK for transcription
- **commander** - CLI argument parsing and help generation
- **@dotenvx/dotenvx** - Environment variable loading

## TypeScript Configuration

Uses strict TypeScript with ESNext modules and Node.js target. Key settings:
- `"module": "nodenext"` for proper ES module support
- `"verbatimModuleSyntax": true` for explicit import/export syntax
- Strict type checking enabled
- Source maps and declarations generated for debugging

## Error Handling Patterns

All modules use try/catch with descriptive error messages. Temporary files are always cleaned up in finally blocks. The CLI provides user-friendly error output with specific guidance for common issues like missing API keys.

### Known Issues

- **yt-dlp Binary Requirements**: The tool now uses yt-dlp through youtube-dl-exec, which should automatically download the yt-dlp binary. If you encounter "binary not found" errors, you may need to install yt-dlp manually using `pip install yt-dlp`.
- **Rate Limiting**: YouTube may temporarily block requests. The tool now implements yt-dlp's built-in anti-detection measures including rate limiting (500K/s), user agent spoofing, and retry logic.
- **Python Dependency**: yt-dlp requires Python 3.7+. Ensure Python is available in your system PATH.