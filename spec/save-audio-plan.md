# Plan: Save Audio File Alongside Transcript

## Current Behavior
- Downloads audio to temporary file (`temp_audio_${videoId}.mp4`)
- Transcribes via AssemblyAI  
- Saves transcript to `transcriptions/{title}/transcript.txt`
- **Deletes temporary audio file**

## Changes Required

### 1. Modify `transcribeYouTubeVideo` function (`src/youtube.ts`)
- Instead of deleting temp audio file, copy it to the same folder as transcript
- Name it appropriately (e.g., `audio.mp4` or use original filename)
- Update cleanup logic to only delete temp file after successful copy

### 2. Add new utility function (`src/utils.ts`)  
- `copyAudioFile(sourcePath: string, destinationDir: string, videoInfo: VideoInfo): Promise<string>`
- Handle file copying with proper error handling

### 3. Update progress tracking (`src/youtube.ts`)
- Add "Saving audio file" step to progress phases
- Update progress weights to account for audio file copying

### 4. Update CLI help/documentation
- No user-facing CLI changes needed - this will be automatic behavior

## Benefits
- Users get both transcript and original audio
- Audio preserved in organized folder structure
- Maintains existing CLI interface

## Implementation Details
- Audio file will be saved as `audio.mp4` in same directory as `transcript.txt`
- Final structure: `transcriptions/{sanitized-title}/[transcript.txt, audio.mp4]`
- Proper error handling for file operations
- Progress tracking for audio copy operation