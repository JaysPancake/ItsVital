import { describe, expect, it } from "vitest";
import type { AlarmThresholds, PatientState } from "@itsvital/protocol";
import { alarmSummary, getActiveAlarms, type ActiveChannels } from "./alarmState";

const patient: PatientState = {
  heartRate: 80,
  spo2: 98,
  respiratoryRate: 16,
  etco2: 35,
  bloodPressure: { systolic: 120, diastolic: 80 },
};

const thresholds: AlarmThresholds = {
  heartRate: { low: 50, high: 120 },
  spo2: { low: 94 },
  respiratoryRate: { low: 8, high: 30 },
  etco2: { low: 30, high: 50 },
};

const allChannels: ActiveChannels = { ecg: true, pleth: true, capnography: true };

describe("getActiveAlarms", () => {
  it("does not alarm when values equal their limits", () => {
    expect(
      getActiveAlarms(
        { ...patient, heartRate: 50, spo2: 94, respiratoryRate: 30, etco2: 30 },
        thresholds,
        allChannels,
      ),
    ).toEqual([]);
  });

  it("reports simultaneous low and high alarms", () => {
    const alarms = getActiveAlarms(
      { ...patient, heartRate: 121, spo2: 93, respiratoryRate: 7, etco2: 51 },
      thresholds,
      allChannels,
    );

    expect(alarms.map(({ vital, direction }) => [vital, direction])).toEqual([
      ["heartRate", "high"],
      ["spo2", "low"],
      ["respiratoryRate", "low"],
      ["etco2", "high"],
    ]);
    expect(alarmSummary(alarms)).toContain("Heart rate HIGH at 121");
  });

  it("suppresses alarms for inactive channels and clears after recovery", () => {
    const abnormalPatient = { ...patient, heartRate: 130, spo2: 90 };

    expect(
      getActiveAlarms(abnormalPatient, thresholds, {
        ecg: false,
        pleth: true,
        capnography: false,
      }).map((alarm) => alarm.vital),
    ).toEqual(["spo2"]);
    expect(getActiveAlarms(patient, thresholds, allChannels)).toEqual([]);
  });
});
