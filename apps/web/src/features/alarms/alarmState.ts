import type { AlarmThresholds, MonitoredVital, PatientState } from "@itsvital/protocol";

export type AlarmDirection = "low" | "high";
export type AlarmChannel = "ecg" | "pleth" | "capnography";

export interface ActiveAlarm {
  vital: MonitoredVital;
  label: string;
  direction: AlarmDirection;
  value: number;
  limit: number;
  channel: AlarmChannel;
}

export type ActiveChannels = Record<AlarmChannel, boolean>;

const alarmDefinitions: Array<{
  vital: MonitoredVital;
  label: string;
  channel: AlarmChannel;
}> = [
  { vital: "heartRate", label: "Heart rate", channel: "ecg" },
  { vital: "spo2", label: "SpO2", channel: "pleth" },
  { vital: "respiratoryRate", label: "Respiratory rate", channel: "capnography" },
  { vital: "etco2", label: "EtCO2", channel: "capnography" },
];

export function getActiveAlarms(
  patient: PatientState,
  thresholds: AlarmThresholds,
  activeChannels: ActiveChannels,
): ActiveAlarm[] {
  const alarms: ActiveAlarm[] = [];

  for (const definition of alarmDefinitions) {
    if (!activeChannels[definition.channel]) {
      continue;
    }

    const value = patient[definition.vital];
    const threshold = thresholds[definition.vital];

    if (value < threshold.low) {
      alarms.push({
        ...definition,
        direction: "low",
        value,
        limit: threshold.low,
      });
    } else if ("high" in threshold && value > threshold.high) {
      alarms.push({
        ...definition,
        direction: "high",
        value,
        limit: threshold.high,
      });
    }
  }

  return alarms;
}

export function alarmSummary(alarms: ActiveAlarm[]): string {
  if (alarms.length === 0) {
    return "No active alarms";
  }

  return alarms
    .map((alarm) => `${alarm.label} ${alarm.direction.toUpperCase()} at ${alarm.value}`)
    .join("; ");
}
