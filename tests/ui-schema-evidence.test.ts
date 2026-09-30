import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyCommands,
  dashboardFixture,
  loginFixture,
  mobileListFixture,
  serializeUIDocument,
  validateUIDocument,
} from "../packages/ui-schema/src/index.js";

describe("UI Schema evidence", () => {
  it("writes fixture, validation and replay artifacts", () => {
    const directory = "artifacts/ui-schema";
    mkdirSync(directory, { recursive: true });

    const fixtures = {
      dashboard: dashboardFixture,
      login: loginFixture,
      "mobile-list": mobileListFixture,
    };
    for (const [name, fixture] of Object.entries(fixtures)) {
      validateUIDocument(fixture);
      writeFileSync(
        `${directory}/${name}.json`,
        `${serializeUIDocument(fixture)}\n`,
      );
    }

    const validationReport = {
      schemaVersion: dashboardFixture.schemaVersion,
      fixtures: Object.keys(fixtures),
      status: "passed",
      validatedAt: "deterministic-fixture-run",
    };
    writeFileSync(
      `${directory}/validation-report.json`,
      `${JSON.stringify(validationReport, null, 2)}\n`,
    );

    const commands = [
      { type: "SetToken", commandId: "evidence.token", nodeId: "dashboard.cta", slot: "background", token: "color.primary" },
      { type: "SetVariant", commandId: "evidence.variant", nodeId: "dashboard.cta", variant: "secondary" },
      { type: "MoveNode", commandId: "evidence.move", nodeId: "dashboard.cta", toIndex: 0 },
    ] as const;
    const before = serializeUIDocument(dashboardFixture);
    const afterDocument = applyCommands(dashboardFixture, commands);
    const after = serializeUIDocument(afterDocument);
    const replay = serializeUIDocument(applyCommands(dashboardFixture, JSON.parse(JSON.stringify(commands))));
    const transcript = {
      schemaVersion: dashboardFixture.schemaVersion,
      commandCount: commands.length,
      commands,
      beforeSha256: createHash("sha256").update(before).digest("hex"),
      afterSha256: createHash("sha256").update(after).digest("hex"),
      replaySha256: createHash("sha256").update(replay).digest("hex"),
      replayMatches: after === replay,
      finalRevision: afterDocument.revision.revision,
    };
    writeFileSync(`${directory}/command-replay.json`, `${JSON.stringify(transcript, null, 2)}\n`);
    expect(transcript.replayMatches).toBe(true);
  });
});
