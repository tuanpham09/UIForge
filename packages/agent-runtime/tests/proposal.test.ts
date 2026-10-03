// biome-ignore-all format: proposal tests remain compact for review
import { workspaceFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import { applyProposal, createProposal, rejectProposal } from "../src/proposal";

describe("proposal engine", () => {
  it("creates an inspectable proposal without mutating the source", () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find((item) => item.type === "text");
    if (!node) throw new Error("text node missing");
    const proposal = createProposal(document, [{ type: "UpdateNode", commandId: "test.update", nodeId: node.id, patch: { content: { ...node.content, text: "Save" } } }], "Change text to Save");
    expect(proposal.status).toBe("pending");
    expect(proposal.baseRevision).toBe(document.revision.revision);
    expect(document.nodes[node.id]?.content?.text).not.toBe("Save");
  });

  it("applies a pending proposal as one semantic transaction", () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find((item) => item.type === "text");
    if (!node) throw new Error("text node missing");
    const proposal = createProposal(document, [{ type: "UpdateNode", commandId: "test.update", nodeId: node.id, patch: { content: { ...node.content, text: "Save" } } }], "Change text");
    const result = applyProposal(document, proposal);
    expect(result.status).toBe("applied");
    expect(result.document?.revision.revision).toBe(document.revision.revision + 1);
    expect(result.document?.nodes[node.id]?.content?.text).toBe("Save");
  });

  it("blocks stale proposals", () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find((item) => item.type === "text");
    if (!node) throw new Error("text node missing");
    const proposal = createProposal(document, [{ type: "UpdateNode", commandId: "test.update", nodeId: node.id, patch: { content: { ...node.content, text: "Save" } } }], "Change text");
    const changed = applyProposal(document, createProposal(document, [{ type: "UpdateNode", commandId: "test.other", nodeId: node.id, patch: { content: { ...node.content, text: "Draft" } } }], "Other change"));
    expect(changed.status).toBe("applied");
    if (!changed.document) throw new Error("expected applied document");
    const stale = applyProposal(changed.document, proposal);
    expect(stale.status).toBe("invalid");
    expect(stale.error?.code).toBe("STALE_PROPOSAL");
  });

  it("applies a non-conflicting proposal against a newer revision", () => {
    const document = structuredClone(workspaceFixture);
    const nodes = Object.values(document.nodes).filter((item) => item.type === "text");
    const node = nodes[0];
    const otherNode = nodes[1];
    if (!node || !otherNode) throw new Error("text nodes missing");

    const proposal = createProposal(
      document,
      [{
        type: "UpdateNode",
        commandId: "test.update",
        nodeId: node.id,
        patch: { content: { ...node.content, text: "Save" } },
      }],
      "Change text",
    );

    const changed = applyProposal(
      document,
      createProposal(
        document,
        [{
          type: "UpdateNode",
          commandId: "test.other",
          nodeId: otherNode.id,
          patch: { content: { ...otherNode.content, text: "Draft" } },
        }],
        "Other change",
      ),
    );
    expect(changed.status).toBe("applied");
    if (!changed.document) throw new Error("expected applied document");

    const rebased = applyProposal(changed.document, proposal);
    expect(rebased.status).toBe("applied");
    expect(rebased.document?.nodes[node.id]?.content?.text).toBe("Save");
    expect(rebased.document?.nodes[otherNode.id]?.content?.text).toBe("Draft");
  });

  it("rejects a stale proposal when its commands no longer apply", () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find((item) => item.type === "text");
    if (!node) throw new Error("text node missing");

    const proposal = createProposal(
      document,
      [{
        type: "DeleteNode",
        commandId: "test.delete",
        nodeId: node.id,
        recursive: true,
      }],
      "Delete text",
    );

    const changed = applyProposal(
      document,
      createProposal(
        document,
        [{
          type: "DeleteNode",
          commandId: "test.other-delete",
          nodeId: node.id,
          recursive: true,
        }],
        "Delete same node",
      ),
    );
    expect(changed.status).toBe("applied");
    if (!changed.document) throw new Error("expected applied document");

    const stale = applyProposal(changed.document, proposal);
    expect(stale.status).toBe("invalid");
    expect(stale.error?.code).toBe("STALE_PROPOSAL");
    expect(stale.error?.message).toContain("could not be safely rebased");
  });

  it("marks rejected proposals without touching the document", () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find((item) => item.type === "text");
    if (!node) throw new Error("text node missing");
    const proposal = createProposal(document, [{ type: "UpdateNode", commandId: "test.update", nodeId: node.id, patch: { content: { ...node.content, text: "Save" } } }], "Change text");
    expect(rejectProposal(proposal).status).toBe("rejected");
    expect(document.revision.revision).toBe(workspaceFixture.revision.revision);
  });
});
