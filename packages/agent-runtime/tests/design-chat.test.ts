import { describe, expect, it } from "vitest";
import { runDesignChat } from "../src/design-chat";
import { workspaceFixture } from "@uiforge/ui-schema";

describe("design chat", () => {
  it("inspects the current screen and proposes a deterministic button creation", async () => {
    const document = structuredClone(workspaceFixture);
    const result = await runDesignChat(document, "add button", {
      screenId: document.screens[0]?.id,
      nodeIds: [],
      frameIds: [],
    });

    expect(result.proposal?.commands[0]?.type).toBe("CreateNode");
    expect(result.events.some((event) => event.type === "agent.tool.completed")).toBe(true);
    expect(result.reply).toContain("Add a button");
  });

  it("returns a clear response for unsupported requests", async () => {
    const document = structuredClone(workspaceFixture);
    const result = await runDesignChat(document, "make the moon purple", {
      screenId: document.screens[0]?.id,
      nodeIds: [],
      frameIds: [],
    });

    expect(result.proposal).toBeUndefined();
    expect(result.reply).toContain("does not have a deterministic mutation rule");
  });

  it("proposes changing selected text", async () => {
    const document = structuredClone(workspaceFixture);
    const textNode = Object.values(document.nodes).find((node) => node.type === "text");
    expect(textNode).toBeDefined();

    const result = await runDesignChat(document, "change text to Save", {
      screenId: textNode?.screenId,
      nodeIds: textNode ? [textNode.id] : [],
      frameIds: [],
    });

    expect(result.proposal?.commands[0]).toMatchObject({
      type: "UpdateNode",
      nodeId: textNode?.id,
    });
  });
});
