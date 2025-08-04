# YouTube Transcripts CLI

A TypeScript CLI tool that extracts transcripts from YouTube videos using AssemblyAI's speech-to-text API.

## Features

- Extract transcripts from any YouTube video
- Automatically creates folders named after the video title
- Uses AssemblyAI for high-quality transcription
- Supports verbose logging
- Automatic cleanup of temporary files

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Get your AssemblyAI API key from [AssemblyAI Dashboard](https://www.assemblyai.com/dashboard/signup)

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your AssemblyAI API key
   ```

## Usage

### Development Mode
```bash
# Set your API key
export ASSEMBLYAI_API_KEY="your_api_key_here"

# Run the CLI
pnpm dev "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Production Build
```bash
# Build the project
pnpm build

# Run the built version
pnpm start "https://www.youtube.com/watch?v=VIDEO_ID"
```

### CLI Options

```bash
youtube-transcripts <url> [options]

Arguments:
  url                    YouTube video URL

Options:
  -o, --output-dir <dir> Output directory (default: ".")
  -v, --verbose          Enable verbose logging
  -h, --help             Display help for command
```

### Examples

```bash
# Basic usage
youtube-transcripts "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# With custom output directory
youtube-transcripts "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --output-dir ./transcripts

# Verbose mode
youtube-transcripts "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --verbose
```

## Output

The tool creates a folder named after the YouTube video title (sanitized and hyphenated) containing a `transcript.txt` file.

Example output structure:
```
how-to-build-a-cli-tool/
└── transcript.txt
```

## Requirements

- Node.js 18+
- AssemblyAI API key
- Internet connection for YouTube and AssemblyAI API access

## Environment Variables

- `ASSEMBLYAI_API_KEY` - Your AssemblyAI API key (required)

## Error Handling

The tool handles various error scenarios:
- Invalid YouTube URLs
- Network connectivity issues
- AssemblyAI API errors
- File system permissions
- Missing API keys

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev <youtube-url>

# Build for production
pnpm build

# Run built version
pnpm start <youtube-url>
```

## Project Structure

```
youtube-transcripts/
├── src/
│   ├── cli.ts          # Main CLI entry point
│   ├── youtube.ts      # YouTube audio extraction
│   ├── transcription.ts # AssemblyAI integration
│   └── utils.ts        # Utility functions
├── spec/
│   └── project-spec.md # Project specification
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## License

ISC