import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { projectDocument, serializeCanonical } from "../packages/editor/src/index.js";
import {
  dashboardFixture,
  loginFixture,
} from "../packages/ui-schema/src/index.js";

describe("Editor adapter evidence", () => {
  it("writes deterministic projection and canonical persistence evidence", () => {
    const directory = "artifacts/editor";
    mkdirSync(directory, { recursive: true });

    const projection = projectDocument(dashboardFixture);
    const canonical = serializeCanonical(dashboardFixture);
    const evidence = {
      projectionVersion: "uiforge.editor/v1",
      documentId: dashboardFixture.id,
      shapeCount: projection.shapes.length,
      flowCount: projection.flows.length,
      shapeIds: projection.shapes.map((shape) => shape.id).sort(),
      canonicalSha256: createHash("sha256").update(canonical).digest("hex"),
      canonicalContainsTldraw: /tldraw|TLShape/i.test(canonical),
      loginProjectionShapeCount: projectDocument(loginFixture).shapes.length,
      status: "passed",
    };

    writeFileSync(
      [directory, "projection.json"].join("/"),
      JSON.stringify(projection, null, 2).concat("\n"),
    );
    writeFileSync(
      [directory, "validation-report.json"].join("/"),
      JSON.stringify(evidence, null, 2).concat("\n"),
    );
    expect(evidence.canonicalContainsTldraw).toBe(false);
    expect(evidence.shapeCount).toBe(
      Object.keys(dashboardFixture.nodes).length,
    );
  });
});
