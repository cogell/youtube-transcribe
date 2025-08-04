# YouTube Transcript CLI Tool Specification

## Overview
A TypeScript CLI tool that extracts transcripts from YouTube videos using AssemblyAI's speech-to-text API. The tool takes a YouTube URL as input, downloads the audio, transcribes it, and saves the transcript in a folder named after the video title.

## Requirements

### Core Functionality
- Accept a single YouTube URL as a command-line argument
- Extract video metadata (title, duration)
- Download audio stream from YouTube video
- Upload audio to AssemblyAI for transcription
- Save transcript to a file in a folder named after the video title
- Clean up temporary files after processing

### Input/Output
- **Input**: YouTube URL (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
- **Output**: Text file containing the transcript in a folder named `{video-title-hyphenated}/`

### Error Handling
- Invalid YouTube URL format
- Video unavailable or private
- Audio extraction failures
- AssemblyAI API errors
- File system errors

## Technical Architecture

### Dependencies
- **CLI Framework**: `commander.js` - Command-line interface parsing
- **YouTube Integration**: `ytdl-core` - YouTube video downloading
- **AssemblyAI SDK**: Official AssemblyAI client for Node.js
- **File System**: Node.js built-in `fs` and `path` modules
- **HTTP Client**: For API requests (if SDK doesn't cover all needs)

### Project Structure
```
youtube-transcripts/
├── src/
│   ├── cli.ts          # Main CLI entry point
│   ├── youtube.ts      # YouTube audio extraction
│   ├── transcription.ts # AssemblyAI integration
│   └── utils.ts        # Utility functions
├── spec/
│   └── project-spec.md # This specification
├── package.json
├── tsconfig.json
└── README.md
```

### Core Modules

#### CLI Module (`src/cli.ts`)
- Parse command-line arguments using commander.js
- Validate YouTube URL format
- Orchestrate the transcription workflow
- Handle errors and provide user feedback

#### YouTube Module (`src/youtube.ts`)
- Extract video metadata (title, ID, duration)
- Download audio stream to temporary file
- Sanitize video title for folder naming
- Clean up temporary audio files

#### Transcription Module (`src/transcription.ts`)
- Initialize AssemblyAI client with API key
- Upload audio file to AssemblyAI
- Submit transcription request
- Poll for transcription completion
- Retrieve and format transcript results

#### Utils Module (`src/utils.ts`)
- String sanitization for file/folder names
- File system operations
- Logging and error formatting

## Workflow

1. **Input Validation**
   - Validate YouTube URL format
   - Check if URL is accessible

2. **Video Processing**
   - Extract video metadata
   - Create sanitized folder name from title
   - Download audio stream to temp file

3. **Transcription**
   - Upload audio to AssemblyAI
   - Submit transcription request
   - Wait for completion (polling)
   - Retrieve transcript text

4. **Output Generation**
   - Create output folder with video title
   - Save transcript as `.txt` file
   - Clean up temporary files

5. **Error Handling**
   - Graceful failure with informative messages
   - Cleanup on interruption or error

## Configuration

### Environment Variables
- `ASSEMBLYAI_API_KEY` - Required API key for AssemblyAI service

### CLI Options
- Primary argument: YouTube URL
- Optional: `--output-dir` - Custom output directory
- Optional: `--verbose` - Detailed logging
- Optional: `--help` - Usage information

## Usage Examples

```bash
# Basic usage
npx youtube-transcripts "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# With custom output directory
npx youtube-transcripts "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --output-dir ./transcripts

# Verbose mode
npx youtube-transcripts "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --verbose
```

## Output Format

### Folder Structure
```
{video-title-hyphenated}/
└── transcript.txt
```

### File Naming Convention
- Folder: Video title converted to lowercase with spaces replaced by hyphens
- File: `transcript.txt` containing the full transcript text

### Example Output
For a video titled "How to Build a CLI Tool":
```
how-to-build-a-cli-tool/
└── transcript.txt
```

## AssemblyAI Integration Details

### Authentication
- API key provided via environment variable
- Included in Authorization header for all requests

### Workflow
1. Upload audio file to AssemblyAI storage
2. Submit transcription request with uploaded file URL
3. Poll status endpoint until transcription completes
4. Retrieve transcript text from completed transcription

### Error Handling
- API rate limiting
- Network connectivity issues
- Invalid audio format errors
- Transcription failures

## Development Considerations

### Performance
- Stream audio download to avoid large memory usage
- Efficient file handling for large videos
- Proper cleanup of temporary files

### Security
- Validate all user inputs
- Secure handling of API keys
- No logging of sensitive information

### Maintainability
- Clear separation of concerns between modules
- Comprehensive error handling
- TypeScript for type safety
- Unit tests for core functionality

## Future Enhancements
- Support for multiple video URLs in batch
- Different output formats (JSON, SRT, etc.)
- Integration with other transcription services
- Caching of previously transcribed videos
- Progress indicators for long-running operations