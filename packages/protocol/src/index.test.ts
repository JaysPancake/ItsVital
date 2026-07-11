import { describe, expect, it } from "vitest";
import { protocolVersion } from "./index";

describe("protocolVersion", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(protocolVersion)).toBe(true);
    expect(protocolVersion).toBeGreaterThan(0);
  });
});
