import { describe, expect, it } from "vitest";
import {
  applyColorStrategy,
  defaultTokenSet,
  exportCSSVariables,
  resolveToken,
  UnknownTokenError,
  validateRawValue,
  validateTokenReference,
  validateTokenSet,
} from "./index.js";

describe("semantic design token engine", () => {
  it("ships a valid default token set", () => {
    expect(validateTokenSet(defaultTokenSet)).toEqual([]);
    expect(resolveToken("color.primary", defaultTokenSet).value).toBe(
      "#2563eb",
    );
    expect(resolveToken("layout.pageGap", defaultTokenSet).value).toBe("24px");
  });

  it("resolves references deterministically and rejects unknown tokens", () => {
    const first = resolveToken("color.primary", defaultTokenSet);
    const second = resolveToken(
      "color.primary",
      structuredClone(defaultTokenSet),
    );
    expect(first).toEqual(second);
    expect(() => resolveToken("color.doesNotExist", defaultTokenSet)).toThrow(
      UnknownTokenError,
    );
    expect(
      validateTokenReference("color.doesNotExist", defaultTokenSet),
    ).toHaveLength(1);
  });

  it("maps upstream Color Strategy roles without inventing a parallel palette", () => {
    const result = applyColorStrategy(defaultTokenSet, {
      version: "uiforge.color-strategy/v1",
      roles: {
        primary: { light: "#7c3aed", dark: "#a78bfa" },
        foreground: { light: "#18181b", dark: "#fafafa" },
      },
    });
    expect(resolveToken("color.primary", result).value).toBe("#7c3aed");
    expect(resolveToken("color.primary", result).themes?.dark).toBe("#a78bfa");
    expect(resolveToken("color.foreground", result).themes?.dark).toBe(
      "#fafafa",
    );
  });

  it("exports stable CSS variables with dark theme overrides", () => {
    const set = applyColorStrategy(defaultTokenSet, {
      version: "uiforge.color-strategy/v1",
      roles: { primary: { light: "#7c3aed", dark: "#a78bfa" } },
    });
    const exported = exportCSSVariables(set);
    expect(exported.css).toContain("--ui-color-primary: #7c3aed;");
    expect(exported.css).toContain('[data-theme="dark"] {');
    expect(exported.css).toContain("--ui-color-primary: #a78bfa;");
    expect(exported.css.indexOf("--ui-color-primary: #7c3aed;")).toBeLessThan(
      exported.css.indexOf("--ui-color-primary: #a78bfa;"),
    );
  });

  it("reports raw values unless explicitly excepted", () => {
    expect(validateRawValue("padding", "13px", defaultTokenSet)).toEqual([
      expect.objectContaining({ code: "RAW_VALUE" }),
    ]);

    const withException = structuredClone(defaultTokenSet);
    withException.rawValueExceptions.push({
      id: "exception.icon-offset",
      property: "transform.translateX",
      value: 1,
      reason: "optical icon alignment",
      approvedBy: "design-system",
    });
    expect(validateRawValue("transform.translateX", 1, withException)).toEqual(
      [],
    );
  });

  it("rejects expired raw-value exceptions", () => {
    const set = structuredClone(defaultTokenSet);
    set.rawValueExceptions.push({
      id: "exception.expired",
      property: "gap",
      value: "13px",
      reason: "legacy fixture",
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    expect(validateRawValue("gap", "13px", set)).toEqual([
      expect.objectContaining({ code: "EXPIRED_EXCEPTION" }),
    ]);
  });

  it("supports breakpoint tokens", () => {
    expect(resolveToken("breakpoint.md", defaultTokenSet).value).toBe("768px");
  });
});
