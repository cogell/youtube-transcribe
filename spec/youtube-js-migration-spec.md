# Migration Plan: @distube/ytdl-core → YouTube.js

## Overview
Migrate from `@distube/ytdl-core` to `youtubei.js` (YouTube.js) for better reliability and API access.

## Changes Required

### 1. Update dependencies
- Remove `@distube/ytdl-core` from package.json
- Add `youtubei.js` dependency

### 2. Refactor `src/youtube.ts`
- Replace ytdl imports with YouTube.js Innertube
- Update `getVideoInfo()` to use Innertube API for video metadata
- Rewrite `downloadAudio()` to use YouTube.js streaming capabilities
- Adapt audio format selection logic for YouTube.js format objects
- Preserve existing language preference and quality selection features
- Maintain compatibility with existing CLI interface

### 3. Update documentation
- Replace references to @distube/ytdl-core with YouTube.js in CLAUDE.md
- Update architecture documentation to reflect new library usage

## Key Benefits
- More reliable API access (uses YouTube's private InnerTube API)
- Better format selection and metadata access
- No reliance on external YouTube API endpoints that may break
- Active maintenance and development
- Cross-platform compatibility (Node.js, Deno, browsers)

## Implementation Strategy

### Phase 1: Dependency Update
1. Update package.json to replace ytdl-core with youtubei.js
2. Install new dependencies

### Phase 2: API Research and Implementation
1. Research YouTube.js API structure and methods
2. Identify equivalent methods for:
   - Getting video information and metadata
   - Accessing audio formats and tracks
   - Downloading audio streams
   - Language selection and format filtering

### Phase 3: Code Migration
1. Update imports in src/youtube.ts
2. Refactor getVideoInfo() function
3. Rewrite downloadAudio() function
4. Adapt audio format selection and filtering logic
5. Ensure error handling patterns are compatible

### Phase 4: Testing and Validation
1. Test with various YouTube URLs
2. Verify language selection functionality works
3. Confirm audio quality selection is preserved
4. Test CLI integration remains functional

### Phase 5: Documentation Update
1. Update CLAUDE.md with new library information
2. Update architecture notes and dependency list

## Compatibility Requirements
- Maintain all existing CLI functionality
- Preserve language preference options (--language flag)
- Keep audio quality selection logic
- Ensure error messages remain user-friendly
- Maintain progress tracking and verbose logging features

## Risk Mitigation
- YouTube.js documentation appears limited, may need to experiment with API
- Test thoroughly with edge cases (private videos, geo-blocked content, etc.)
- Ensure fallback behavior for unsupported formats
- Validate that all audio codec types are supported