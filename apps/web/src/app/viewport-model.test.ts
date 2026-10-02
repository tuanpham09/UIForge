import { describe, expect, it } from "vitest";
import {
  customViewport,
  parseViewport,
  rotateViewport,
  serializeViewport,
  validateViewport,
  viewportFromPreset,
} from "./viewport-model";

describe("viewport preview model", () => {
  it("resolves iPhone presets from the shared frame registry", () => {
    const viewport = viewportFromPreset("iphone-16");
    expect(viewport.width).toBe(402);
    expect(viewport.height).toBe(874);
    expect(viewport.orientation).toBe("portrait");
  });

  it("rotates without changing the viewport dimensions", () => {
    const viewport = rotateViewport(viewportFromPreset("iphone-16"));
    expect(viewport.width).toBe(874);
    expect(viewport.height).toBe(402);
    expect(viewport.orientation).toBe("landscape");
  });

  it("round-trips viewport state through URL parameters", () => {
    const source = customViewport(1111, 777, 125);
    const parsed = parseViewport(\n      new URLSearchParams(serializeViewport(source)),\n    );
    expect(parsed).toEqual(source);
  });

  it("reports actionable overflow", () => {
    const diagnostics = validateViewport(390, [
      { id: "hero", x: 12, width: 500 },
    ]);
    expect(diagnostics[0]?.code).toBe("OVERFLOW");
    expect(diagnostics[0]?.message).toContain("hero");
    expect(diagnostics[0]?.message).toContain("122px");
  });
});
