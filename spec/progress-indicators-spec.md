# Progress Indicators & Time Estimates Specification

## Overview
Add comprehensive progress tracking with percentage completion and time estimates across all phases of the YouTube transcription workflow.

## Key Changes

### 1. Dependencies
- Add `cli-progress` for customizable progress bars
- Add `ora` for spinners during indeterminate operations

### 2. Progress Manager (`src/progress.ts`)
- Create centralized progress coordination class
- Track overall progress across phases (download → upload → transcribe → save)
- Calculate and display time estimates
- Support both determinate (%) and indeterminate progress

### 3. Enhanced Download Progress (`src/youtube.ts`)
- Modify `downloadAudio()` to track ytdl stream progress events
- Show download percentage: `(bytesDownloaded / totalBytes) * 100`
- Estimate time remaining based on download speed
- Display file size and current download speed

### 4. Upload Progress Tracking (`src/transcription.ts`)
- Investigate AssemblyAI SDK for upload progress callbacks
- If unavailable, show indeterminate progress with file size info
- Track upload phase separately from transcription processing

### 5. Transcription Progress (`src/transcription.ts`)
- Replace `client.transcripts.transcribe()` with manual submit + polling:
  - `client.transcripts.submit()` to start job
  - Poll `client.transcripts.get(id)` for status updates
- Extract any progress info from AssemblyAI responses
- Estimate completion time based on audio duration (0.5x real-time baseline)
- Show elapsed time and estimated remaining time

### 6. Progress Display Strategy
- **Overall progress bar**: Shows total completion across all phases
- **Current phase indicator**: Detailed progress for active operation
- **Time estimates**: "X% complete, ~Y minutes remaining"
- **Speed indicators**: Download/upload speeds when available

### 7. Integration Points
- Update CLI to initialize progress tracking
- Modify verbose logging to work alongside progress bars
- Ensure progress updates don't interfere with error messages
- Clean progress display on completion or error

## Expected User Experience
```
Downloading audio... ████████████████████████████████████████ 100% (2.5 MB/s, 0s remaining)
Uploading to AssemblyAI... ████████████████████████████████████████ 100% (1.2 MB/s, 0s remaining)  
Transcribing audio... ████████████████████░░░░░░░░░░░░░░░░░░░░ 68% (2.1 min elapsed, ~1.1 min remaining)
Overall Progress: ████████████████████████████░░░░░░░░░░░░ 78% complete
```

This plan focuses on providing accurate percentage-based progress where possible, with intelligent time estimates to give users confidence that the process is working and approximately how long it will take.