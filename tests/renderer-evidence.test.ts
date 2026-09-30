import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderScreen, getViewport } from "../packages/renderer/src/index";
import { dashboardFixture, loginFixture, mobileListFixture } from "../packages/ui-schema/src/index";
import { defaultTokenSet } from "../packages/design-tokens/src/index";

describe("Renderer evidence", () => {
  it("writes deterministic fixture evidence", () => {
    mkdirSync("artifacts/renderer", { recursive: true });
    const records = [dashboardFixture, loginFixture, mobileListFixture].map((document) => {
      const screen = document.screens[0];
      if (!screen) throw new Error(`Missing screen in fixture ${document.id}`);
      const desktop = renderScreen(document, screen.id, defaultTokenSet, { viewport: getViewport("desktop") });
      const mobile = renderScreen(document, screen.id, defaultTokenSet, { viewport: getViewport("mobile") });
      return { documentId: document.id, screenId: screen.id, desktopDiagnostics: desktop.diagnostics, mobileDiagnostics: mobile.diagnostics };
    });
    const canonical = JSON.stringify(records);
    writeFileSync("artifacts/renderer/fixtures.json", JSON.stringify(records, null, 2).concat("\n"));
    writeFileSync("artifacts/renderer/validation-report.json", JSON.stringify({ rendererVersion: "uiforge.renderer/v1", sha256: createHash("sha256").update(canonical).digest("hex"), status: "passed" }, null, 2).concat("\n"));
  });
});
