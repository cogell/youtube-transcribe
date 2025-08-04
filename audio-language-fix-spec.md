# Audio Language Mismatch Fix - Technical Specification

## Problem Statement

YouTube videos sometimes have multiple audio tracks in different languages, and the current download logic selects the highest quality audio regardless of language, causing transcription of wrong language audio.

**Current Behavior:**
- Uses `quality: 'highestaudio'` without language consideration
- May download dubbed tracks, secondary languages, or audio descriptions
- Results in transcripts that don't match the video's original/intended language

## Root Cause Analysis

In `src/youtube.ts:34-37`, the ytdl configuration:
```typescript
const audioStream = ytdl(url, {
  quality: 'highestaudio',
  filter: 'audioonly',
});
```

This selects audio purely by quality metrics, ignoring language preferences.

## Proposed Solution

### 1. Language Detection and Filtering

**Modify `src/youtube.ts`:**
- Extract video language from YouTube metadata using `ytdl.getInfo()`
- Filter available audio formats to prefer original language tracks
- Add fallback logic when language information isn't available

### 2. Enhanced Audio Format Selection

**Update ytdl options to:**
- Consider both quality AND language when selecting audio
- Add custom format filtering function
- Include logging to show which audio track was selected
- Prefer formats that match the video's detected language

### 3. CLI Language Control

**Add to `src/cli.ts`:**
- New `--language <code>` CLI option for user override
- Auto-detect from video metadata by default
- Display selected language in verbose output
- Support common language codes (en, es, fr, etc.)

### 4. Implementation Details

**New functions to add:**
- `detectVideoLanguage(info)` - Extract language from video metadata
- `filterAudioByLanguage(formats, preferredLang)` - Filter formats by language
- `selectBestAudioFormat(formats, preferredLang)` - Smart selection logic

**Modified functions:**
- `downloadAudio()` - Update to use language-aware format selection
- `getVideoInfo()` - Include language information in return value

### 5. Fallback Strategy

When language detection fails or no matching language found:
1. Prefer formats without language tags (likely original)
2. Fall back to highest quality audio
3. Log warnings about language uncertainty

## Expected Outcomes

- Transcriptions will match the video's intended audio language
- Users can override language selection when needed
- Better transparency about which audio track is being processed
- Maintains backward compatibility for existing workflows