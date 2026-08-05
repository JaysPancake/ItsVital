import { useEffect, useRef, useState } from "react";

export type AlarmAudioState = "not-enabled" | "enabled" | "unavailable";

const beepDurationSeconds = 0.14;
const patternIntervalMs = 2_000;

function playBeep(context: AudioContext, startTime: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + beepDurationSeconds);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + beepDurationSeconds + 0.01);
}

function playPattern(context: AudioContext) {
  const startTime = context.currentTime + 0.02;
  playBeep(context, startTime);
  playBeep(context, startTime + 0.25);
}

export function useAlarmAudio(active: boolean, muted: boolean) {
  const [state, setState] = useState<AlarmAudioState>("not-enabled");
  const contextRef = useRef<AudioContext | null>(null);

  const enable = async () => {
    try {
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      await context.resume();
      setState("enabled");
    } catch {
      setState("unavailable");
    }
  };

  useEffect(() => {
    const context = contextRef.current;

    if (state !== "enabled" || !active || muted || !context) {
      return;
    }

    playPattern(context);
    const interval = window.setInterval(() => playPattern(context), patternIntervalMs);

    return () => window.clearInterval(interval);
  }, [active, muted, state]);

  useEffect(
    () => () => {
      if (contextRef.current) {
        void contextRef.current.close();
      }
    },
    [],
  );

  return { state, enable };
}
