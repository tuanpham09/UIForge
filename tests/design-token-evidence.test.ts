import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyColorStrategy,
  defaultTokenSet,
  exportCSSVariables,
  validateRawValue,
  validateTokenSet,
} from "../packages/design-tokens/src/index.js";

describe("Design token evidence", () => {
  it("writes canonical token JSON, CSS and validation artifacts", () => {
    const directory = "artifacts/design-tokens";
    mkdirSync(directory, { recursive: true });

    const tokenSet = applyColorStrategy(defaultTokenSet, {
      version: "uiforge.color-strategy/v1",
      roles: {
        primary: { light: "#7c3aed", dark: "#a78bfa" },
        background: { light: "#ffffff", dark: "#09090b" },
        foreground: { light: "#18181b", dark: "#fafafa" },
      },
    });

    const css = exportCSSVariables(tokenSet);
    const validation = validateTokenSet(tokenSet);
    const rawValueViolation = validateRawValue("padding", "13px", tokenSet);

    writeFileSync(
      `${directory}/tokens.json`,
      `${JSON.stringify(tokenSet, null, 2)}\n`,
    );
    writeFileSync(`${directory}/tokens.css`, `${css.css}\n`);
    writeFileSync(
      `${directory}/validation-report.json`,
      `${JSON.stringify({ status: validation.length === 0 ? "passed" : "failed", validation, rawValueViolation }, null, 2)}\n`,
    );

    expect(validation).toEqual([]);
    expect(rawValueViolation[0]?.code).toBe("RAW_VALUE");
    expect(css.css).toContain('[data-theme="dark"]');
  });
});
