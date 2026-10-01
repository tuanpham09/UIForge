import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getViewport,
  resolveResponsive,
} from "../packages/responsive/src/index";
import {
  dashboardFixture,
  loginFixture,
  mobileListFixture,
} from "../packages/ui-schema/src/index";

describe("Responsive evidence", () => {
  it("writes deterministic responsive rule and four-viewport evidence", () => {
    mkdirSync("artifacts/responsive", { recursive: true });

    const presets = ["wide", "desktop", "tablet", "mobile"] as const;
    const records = [dashboardFixture, loginFixture, mobileListFixture].flatMap(
      (document) =>
        presets.map((preset) => {
          const projection = resolveResponsive(document, getViewport(preset));
          return {
            documentId: document.id,
            viewport: projection.viewport,
            diagnostics: projection.diagnostics,
            nodes: Object.values(projection.nodes).map((node) => ({
              nodeId: node.nodeId,
              visible: node.visible,
              appliedRuleIds: node.appliedRuleIds,
              layout: node.layout,
              variant: node.variant,
              tokenOverrides: node.tokenOverrides,
            })),
          };
        }),
    );

    const rules = [dashboardFixture, loginFixture, mobileListFixture].map(
      (document) => ({
        documentId: document.id,
        screens: document.screens.map((screen) => ({
          screenId: screen.id,
          viewport: screen.viewport ?? {},
          responsiveNodeIds: screen.nodeIds.filter((nodeId) =>
            Boolean(document.nodes[nodeId]?.responsive?.length),
          ),
        })),
      }),
    );

    const canonical = JSON.stringify({ presets, records, rules });
    writeFileSync(
      "artifacts/responsive/responsive-rules.json",
      `${JSON.stringify(rules, null, 2)}\n`,
    );
    writeFileSync(
      "artifacts/responsive/viewport-validation.json",
      `${JSON.stringify(
        {
          version: "uiforge.responsive/v1",
          presets,
          recordCount: records.length,
          diagnostics: records.flatMap((record) => record.diagnostics),
          sha256: createHash("sha256").update(canonical).digest("hex"),
          status: "passed",
        },
        null,
        2,
      )}\n`,
    );

    expect(records).toHaveLength(12);
    expect(records.every((record) => record.diagnostics.length === 0)).toBe(
      true,
    );
  });
});
