// biome-ignore-all format: deterministic contract fixtures are kept compact
// biome-ignore-all assist/source/organizeImports: test imports are intentionally grouped
import { describe, expect, it } from "vitest";
import type { ProviderResult } from "@uiforge/ai";
import { MockAIProvider } from "@uiforge/ai";
import { buildColorStrategy } from "@uiforge/color-intelligence";
import type { AIProvider } from "@uiforge/ai";
import type { ProductIntent } from "@uiforge/design-intelligence";
import type { UIDocument } from "@uiforge/ui-schema";
import {
  applySelectedNodePatch,
  generateTextToUI,
  previewSelectedNodePatch,
  validateExperienceGraph,
} from "../src";
import type { TextToUIProviderOutput } from "../src";

const intent: ProductIntent = {
  domain: "finance",
  productType: "expense manager",
  primaryTasks: ["view spending", "add transaction"],
  platforms: ["web", "mobile"],
};

const colorStrategy = buildColorStrategy({
  primary: "#2563eb",
  secondary: "#475569",
  domain: "finance",
  designStrategyVersion: "uiforge.design-strategy/v1",
});

function canonicalDocument(): UIDocument {
  return {
    schemaVersion: "uiforge.schema/v1",
    id: "expense-manager",
    metadata: { name: "Expense Manager" },
    revision: { revision: 1, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", source: "ai" },
    screens: [{
      id: "dashboard",
      name: "Dashboard",
      rootNodeId: "dashboard.root",
      nodeIds: ["dashboard.root", "dashboard.title", "dashboard.add"],
    }],
    nodes: {
      "dashboard.root": { id: "dashboard.root", screenId: "dashboard", parentId: null, childrenIds: ["dashboard.title", "dashboard.add"], type: "screen-root", layout: { mode: "stack", direction: "column", gap: { token: "space.4" } } },
      "dashboard.title": { id: "dashboard.title", screenId: "dashboard", parentId: "dashboard.root", childrenIds: [], type: "text", layout: { mode: "flex" }, content: { text: "Spending" }, style: { tokens: { color: "color.foreground" } } },
      "dashboard.add": { id: "dashboard.add", screenId: "dashboard", parentId: "dashboard.root", childrenIds: [], type: "link", layout: { mode: "flex", padding: { block: { token: "space.4" }, inline: { token: "space.4" } } }, content: { label: "Add transaction" }, component: { registryId: "uiforge.navigation", variant: "default" }, accessibility: { accessibleName: "Add transaction" }, interaction: { interactive: true, trigger: "click", action: "navigate", targetScreenId: "add" }, style: { tokens: { color: "color.primary" } } },
    },
    assets: {},
  };
}

function provider(output: TextToUIProviderOutput): AIProvider {
  const base = new MockAIProvider();
  return {
    generateStructured: async () => ({ raw: output, metadata: {
      provider: "mock", model: { provider: "mock", model: "text-to-ui-deterministic", version: "1" },
      prompt: { id: "ui-generation", version: "uiforge.ai-prompt/ui-generation-v1" },
      requestId: "text-to-ui-test-1", usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30, estimatedCostUsd: 0 }, latencyMs: 1,
    }} satisfies ProviderResult<unknown>),
    proposePatch: base.proposePatch.bind(base),
    analyzeScreenshot: base.analyzeScreenshot.bind(base),
  };
}

const graph = {
  version: "uiforge.experience-graph/v1" as const,
  nodes: [{ id: "dashboard", screenId: "dashboard", label: "Dashboard" }, { id: "add", screenId: "add", label: "Add" }],
  transitions: [{ id: "dashboard-add", fromScreenId: "dashboard", toScreenId: "add", sourceNodeId: "dashboard.add", trigger: "click" as const, kind: "navigation" as const }],
};

describe("text-to-ui", () => {
  it("generates a deterministic canonical UI contract with strategy and color provenance", async () => {
    const document = canonicalDocument();
    document.screens.push({ id: "add", name: "Add", rootNodeId: "add.root", nodeIds: ["add.root"] });
    document.nodes["add.root"] = { id: "add.root", screenId: "add", parentId: null, childrenIds: [], type: "screen-root", layout: { mode: "stack" } };
    const result = await generateTextToUI({
      intent,
      colorStrategy,
      provider: provider({ schemaVersion: "uiforge.text-to-ui-output/v1", document, experienceGraph: graph }),
      journey: ["add transaction"],
    });
    expect(result.document.schemaVersion).toBe("uiforge.schema/v1");
    expect(result.strategy.skills).toContain("personal-finance");
    expect(result.colorStrategy.version).toBe("uiforge.color-strategy/v1");
    expect(result.provenance.skillIds).toEqual(result.strategy.skills);
    expect(result.providerMetadata.usage?.totalTokens).toBe(30);
  });

  it("rejects an invalid transition destination before persistence", async () => {
    const document = canonicalDocument();
    const bad = { ...graph, transitions: [{ ...graph.transitions[0], toScreenId: "missing" }] };
    await expect(generateTextToUI({
      intent,
      colorStrategy,
      provider: provider({ schemaVersion: "uiforge.text-to-ui-output/v1", document, experienceGraph: bad }),
    })).rejects.toThrow("FLOW_INVALID:destination");
  });

  it("rejects a color role that is not in the project strategy", async () => {
    const document = canonicalDocument();
    document.nodes["dashboard.title"].style = { tokens: { color: "color.brandMagic" } };
    await expect(generateTextToUI({
      intent,
      colorStrategy,
      provider: provider({ schemaVersion: "uiforge.text-to-ui-output/v1", document, experienceGraph: { ...graph, nodes: [{ id: "dashboard", screenId: "dashboard", label: "Dashboard" }] } }),
    })).rejects.toThrow("COLOR_ROLE_INVALID");
  });

  it("uses Component Intelligence for supported component decisions", async () => {
    const document = canonicalDocument();
    document.screens.push({ id: "add", name: "Add", rootNodeId: "add.root", nodeIds: ["add.root"] });
    document.nodes["add.root"] = { id: "add.root", screenId: "add", parentId: null, childrenIds: [], type: "screen-root", layout: { mode: "stack" } };
    const result = await generateTextToUI({
      intent,
      colorStrategy,
      provider: provider({ schemaVersion: "uiforge.text-to-ui-output/v1", document, experienceGraph: graph }),
    });
    const button = result.componentDecisions.find(d => d.componentId === "uiforge.button");
    expect(button).toBeUndefined();
    expect(result.document.nodes["dashboard.add"]?.component?.registryId).toBe("uiforge.navigation");
  });

  it("patch preview changes only the selected node and does not apply until requested", () => {
    const document = canonicalDocument();
    const preview = previewSelectedNodePatch(document, "dashboard.title", { content: { text: "This month" } });
    expect(preview.changedNodeIds).toEqual(["dashboard.title"]);
    expect(document.nodes["dashboard.title"].content?.text).toBe("Spending");
    const next = applySelectedNodePatch(document, preview);
    expect(next.nodes["dashboard.title"].content?.text).toBe("This month");
    expect(next.nodes["dashboard.add"].content?.label).toBe("Add transaction");
  });

  it("rejects invalid generated schema before it can be persisted", async () => {
    const document = canonicalDocument();
    document.nodes["dashboard.add"].parentId = null;
    await expect(generateTextToUI({
      intent,
      colorStrategy,
      provider: provider({ schemaVersion: "uiforge.text-to-ui-output/v1", document, experienceGraph: { ...graph, nodes: [{ id: "dashboard", screenId: "dashboard", label: "Dashboard" }] } }),
    })).rejects.toThrow("UI Schema validation failed");
  });

  it("validates flow graph destinations independently", () => {
    const document = canonicalDocument();
    expect(() => validateExperienceGraph(graph, document)).toThrow("FLOW_INVALID:destination");
  });
});
