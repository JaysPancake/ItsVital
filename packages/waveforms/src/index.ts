export interface WaveformRenderer {
  clear(): void;
  render(samples: readonly number[]): void;
}
