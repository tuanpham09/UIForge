import { describe, expect, it } from "vitest";
import { foundation } from "../packages/shared/src/index.js";

describe("foundation contract", () => {
  it("exposes stable toolchain metadata", () => {
    expect(foundation.schemaVersion).toBe("uiforge.foundation/v1");
    expect(foundation.nodeMajor).toBe(24);
    expect(foundation.packageManager).toBe("pnpm@12.7.0");
  });
});
