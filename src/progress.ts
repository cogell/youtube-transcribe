import cliProgress from 'cli-progress';
import type { Ora } from 'ora';

export interface ProgressPhase {
  name: string;
  weight: number; // Relative weight for overall progress calculation
}

export interface ProgressUpdate {
  phase: string;
  current: number;
  total: number;
  message?: string;
  speed?: string;
  eta?: string;
}

export class ProgressManager {
  private phases: ProgressPhase[];
  private currentPhaseIndex: number = 0;
  private phaseProgress: number = 0;
  private phaseBar: cliProgress.SingleBar | null = null;
  private spinner: Ora | null = null;
  private startTime: number;
  private verbose: boolean;

  constructor(phases: ProgressPhase[], verbose: boolean = false) {
    this.phases = phases;
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  startPhase(phaseName: string, useProgressBar: boolean = true): void {
    const phaseIndex = this.phases.findIndex(p => p.name === phaseName);
    if (phaseIndex === -1) {
      throw new Error(`Unknown phase: ${phaseName}`);
    }

    this.currentPhaseIndex = phaseIndex;
    this.phaseProgress = 0;

    // Stop any existing phase progress indicator
    if (this.phaseBar) {
      this.phaseBar.stop();
      this.phaseBar = null;
    }
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }

    if (useProgressBar) {
      // Create phase-specific progress bar with overall progress included
      const paddedPhaseName = phaseName.padEnd(23);
      this.phaseBar = new cliProgress.SingleBar({
        format: `${paddedPhaseName} |{bar}| {percentage}% | {message} | {speed} | ETA: {eta_formatted} | Overall: {overall}%`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      });
      this.phaseBar.start(100, 0, {
        message: 'Starting...',
        speed: '',
        eta_formatted: 'calculating...',
        overall: Math.round(this.getOverallProgress())
      });
    }
  }

  updatePhaseProgress(current: number, total: number, message?: string, speed?: string): void {
    if (total === 0) return;

    this.phaseProgress = Math.min(100, (current / total) * 100);

    // Calculate ETA based on current progress and elapsed time
    const elapsed = Date.now() - this.startTime;
    const overallProgress = this.getOverallProgress();
    const eta = overallProgress > 0 ? (elapsed / overallProgress) * (100 - overallProgress) : 0;
    const etaFormatted = this.formatTime(eta);

    if (this.phaseBar) {
      this.phaseBar.update(this.phaseProgress, {
        message: message || '',
        speed: speed || '',
        eta_formatted: etaFormatted,
        overall: Math.round(overallProgress)
      });
    }
  }

  completePhase(): void {
    this.phaseProgress = 100;

    if (this.phaseBar) {
      this.phaseBar.update(100, {
        message: 'Complete',
        speed: '',
        eta_formatted: '0s',
        overall: Math.round(this.getOverallProgress())
      });
      this.phaseBar.stop();
      this.phaseBar = null;
    }

    if (this.spinner) {
      this.spinner.succeed();
      this.spinner = null;
    }
  }


  private getOverallProgress(): number {
    const totalWeight = this.phases.reduce((sum, phase) => sum + phase.weight, 0);
    let completedWeight = 0;

    // Add weight for completed phases
    for (let i = 0; i < this.currentPhaseIndex; i++) {
      completedWeight += this.phases[i]!.weight;
    }

    // Add partial weight for current phase
    if (this.currentPhaseIndex < this.phases.length) {
      const currentPhaseWeight = this.phases[this.currentPhaseIndex]!.weight;
      completedWeight += (currentPhaseWeight * this.phaseProgress) / 100;
    }

    return Math.min(100, (completedWeight / totalWeight) * 100);
  }

  private formatTime(milliseconds: number): string {
    if (milliseconds < 1000) return '< 1s';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  complete(): void {
    if (this.phaseBar) {
      this.phaseBar.stop();
    }
    if (this.spinner) {
      this.spinner.succeed();
    }

    const totalTime = this.formatTime(Date.now() - this.startTime);
    console.log(`\n✅ Transcription completed successfully in ${totalTime}!`);
  }

  error(message: string): void {
    if (this.phaseBar) {
      this.phaseBar.stop();
    }
    if (this.spinner) {
      this.spinner.fail();
    }

    console.log(`\n❌ Error: ${message}`);
  }

  log(message: string): void {
    if (this.verbose) {
      // For verbose mode, just log without interfering with progress bars
      console.log(`🔍 ${message}`);
    }
  }
}