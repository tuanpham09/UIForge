import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  UICommandError,
  UI_SCHEMA_VERSION,
  UISchemaValidationError,
  applyCommand,
  applyCommands,
  dashboardFixture,
  deserializeUIDocument,
  loginFixture,
  migrateToCurrent,
  mobileListFixture,
  serializeUIDocument,
  validateUIDocument,
} from "../packages/ui-schema/src/index.js";

describe("UI Schema v1 validation", () => {
  it("validates all canonical fixtures", () => {
    for (const fixture of [dashboardFixture, loginFixture, mobileListFixture]) {
      expect(() => validateUIDocument(fixture)).not.toThrow();
      expect(fixture.schemaVersion).toBe(UI_SCHEMA_VERSION);
    }
  });

  it("rejects malformed nodes", () => {
    const malformed = structuredClone(dashboardFixture);
    const node = malformed.nodes["dashboard.summary"];
    delete (node as { layout?: unknown }).layout;
    expect(() => validateUIDocument(malformed)).toThrow(UISchemaValidationError);
  });

  it("rejects broken hierarchy references", () => {
    const malformed = structuredClone(dashboardFixture);
    malformed.nodes["dashboard.summary"].parentId = "screen.dashboard.root";
    malformed.nodes["screen.dashboard.root"].childrenIds = [];
    expect(() => validateUIDocument(malformed)).toThrow(/does not contain child/);
  });

  it("fails explicitly for unknown schema versions", () => {
    const unknown = { ...dashboardFixture, schemaVersion: "uiforge.schema/v999" };
    expect(() => validateUIDocument(unknown)).toThrow(/unsupported schema version/);
  });

  it("round-trips deterministic serialization", () => {
    const a = serializeUIDocument(dashboardFixture);
    const b = serializeUIDocument(deserializeUIDocument(a));
    expect(a).toBe(b);
    expect(createHash("sha256").update(a).digest("hex")).toBe(
      createHash("sha256").update(b).digest("hex"),
    );
  });
});

describe("typed command model", () => {
  it("applies and replays serializable commands deterministically", () => {
    const first = dashboardFixture;
    const commands = [
      {
        type: "SetToken",
        commandId: "cmd.token",
        nodeId: "dashboard.cta",
        slot: "background",
        token: "color.primary",
      },
      {
        type: "SetVariant",
        commandId: "cmd.variant",
        nodeId: "dashboard.cta",
        variant: "secondary",
      },
      {
        type: "MoveNode",
        commandId: "cmd.move",
        nodeId: "dashboard.cta",
        toIndex: 0,
      },
    ] as const;

    const applied = applyCommands(first, commands);
    const replayed = applyCommands(first, JSON.parse(JSON.stringify(commands)));

    expect(serializeUIDocument(applied)).toBe(serializeUIDocument(replayed));
    expect(applied.revision.revision).toBe(4);
    expect(applied.nodes["dashboard.cta"].style?.tokens?.background).toBe("color.primary");
    expect(applied.nodes["dashboard.cta"].component?.variant).toBe("secondary");
  });

  it("supports create, reparent, responsive and code mapping commands", () => {
    const created = applyCommand(dashboardFixture, {
      type: "CreateNode",
      commandId: "cmd.create",
      node: {
        id: "dashboard.new" as never,
        screenId: "screen.dashboard" as never,
        parentId: "dashboard.summary" as never,
        childrenIds: [],
        type: "text",
        layout: { mode: "flex", direction: "column" },
        content: { text: "New" },
      },
    });

    const reparented = applyCommand(created, {
      type: "ReparentNode",
      commandId: "cmd.reparent",
      nodeId: "dashboard.new" as never,
      newParentId: "dashboard.cta" as never,
      toIndex: 0,
    });

    const responsive = applyCommand(reparented, {
      type: "SetResponsiveRule",
      commandId: "cmd.responsive",
      nodeId: "dashboard.cta" as never,
      rule: { breakpoint: "md", hidden: false },
    });

    const mapped = applyCommand(responsive, {
      type: "SetCodeMapping",
      commandId: "cmd.mapping",
      nodeId: "dashboard.cta" as never,
      mapping: {
        source: "@/components/Button",
        exportName: "Button",
        componentName: "Button",
      },
    });

    expect(mapped.nodes["dashboard.new"].parentId).toBe("dashboard.cta");
    expect(mapped.nodes["dashboard.cta"].responsive?.[0]?.breakpoint).toBe("md");
    expect(mapped.nodes["dashboard.cta"].codeMapping).toEqual({
      source: "@/components/Button",
      exportName: "Button",
      componentName: "Button",
    });
  });

  it("rejects deleting a parent without recursive mode", () => {
    expect(() =>
      applyCommand(dashboardFixture, {
        type: "DeleteNode",
        commandId: "cmd.delete",
        nodeId: "dashboard.summary" as never,
      }),
    ).not.toThrow();

    expect(() =>
      applyCommand(dashboardFixture, {
        type: "DeleteNode",
        commandId: "cmd.delete-parent",
        nodeId: "screen.dashboard.root" as never,
      }),
    ).toThrow(UICommandError);
  });

  it("migrates through an explicit interface", () => {
    const migrated = migrateToCurrent(
      { schemaVersion: "uiforge.schema/v0", ...dashboardFixture },
      [
        {
          from: "uiforge.schema/v0",
          to: UI_SCHEMA_VERSION,
          migrate: (document) => ({
            ...(document as object),
            schemaVersion: UI_SCHEMA_VERSION,
          }),
        },
      ],
    );
    expect(migrated.schemaVersion).toBe(UI_SCHEMA_VERSION);
  });
});
