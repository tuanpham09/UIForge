// biome-ignore-all format: dense editor workspace JSX is maintained as a product-layout surface
"use client";

import { buildVisualDesignProposal } from "@uiforge/design-intelligence";
import {
  buildLayerTree,
  filterLayers,
  type SemanticLayer,
} from "@uiforge/editor";
import {
  createPrototypeSession,
  EXPERIENCE_GRAPH_VERSION,
  type ExperienceGraph,
  goBack,
  type PrototypeSession,
  resolveTransition,
} from "@uiforge/experience-graph";
import {
  applyCommand,
  createFrameFromPreset,
  dashboardFixture,
  FRAME_PRESETS,
  type Frame,
  type FrameId,
  type NodeId,
  type NodePatch,
  type ResponsiveRule,
  type UIDocument,
} from "@uiforge/ui-schema";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Editor, Tldraw, toRichText } from "tldraw";
import "tldraw/tldraw.css";
import {
  BREAKPOINTS,
  commonTokenSlots,
  findResponsiveRule,
  inspectFrame,
  inspectNode,
  nodeLabel,
  TOKEN_OPTIONS,
} from "./inspector-model";
import {
  customViewport,
  DEVICE_PRESETS,
  parseViewport,
  rotateViewport,
  serializeViewport,
  type ViewportState,
  validateViewport,
  viewportFromPreset,
  ZOOM_PRESETS,
} from "./viewport-model";


const cloneDocument = (): UIDocument => structuredClone(dashboardFixture);

type CustomFrameDraft = {
  open: boolean;
  width: string;
  height: string;
};

type InspectorSectionProps = { title: string; children: React.ReactNode };
function InspectorSection({ title, children }: InspectorSectionProps) {
  return (
    <section>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block text-[10px] text-slate-500">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NumberPair({
  label,
  value,
  min,
  onCommit,
}: {
  label: string;
  value: number;
  min?: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <label className="flex items-center gap-2 text-[10px] text-slate-500">
      <span className="w-3">{label}</span>
      <input
        aria-label={label}
        type="number"
        min={min}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = Number(draft);
          if (!Number.isFinite(next) || (min !== undefined && next < min)) return;
          onCommit(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[10px] text-slate-400">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function InspectorDiagnostics({
  diagnostics,
}: {
  diagnostics: { severity: "error" | "warning" | "ok"; code: string; message: string }[];
}) {
  const hasError = diagnostics.some((item) => item.severity === "error");
  return (
    <section>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Diagnostics</p>
      <div className={`rounded border p-2 text-[10px] ${hasError ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"}`}>
        {diagnostics.map((item) => <div key={item.code + item.message}>✓ {item.message}</div>)}
      </div>
    </section>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="w-full rounded border border-slate-700 px-2 py-1.5 text-[10px] text-slate-400 hover:bg-slate-800">Reset to snapshot</button>;
}

export default function EditorCanvas() {
  const initialDocumentRef = useRef<UIDocument>(cloneDocument());
  const [document, setDocument] = useState<UIDocument>(() => structuredClone(initialDocumentRef.current));
  const [selectedFrameId, setSelectedFrameId] = useState<FrameId | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);
  const [selectedFrameIds, setSelectedFrameIds] = useState<FrameId[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<NodeId[]>([]);
  const [layerQuery, setLayerQuery] = useState("");
  const [historyPast, setHistoryPast] = useState<UIDocument[]>([]);
  const [historyFuture, setHistoryFuture] = useState<UIDocument[]>([]);
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [present, setPresent] = useState(false);
  const [prototypeSession, setPrototypeSession] = useState<PrototypeSession | null>(null);
  const [designBusy, setDesignBusy] = useState(false);
  const [customFrame, setCustomFrame] = useState<CustomFrameDraft>({
    open: false,
    width: "390",
    height: "844",
  });
  const editorRef = useRef<Editor | null>(null);
  // Keep the first render deterministic between SSR and hydration.
  // URL state is applied only after mount so a shareable viewport cannot change
  // the server-rendered device label before React hydrates.
  const [viewport, setViewport] = useState<ViewportState>(() =>
    viewportFromPreset("iphone-16"),
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    setViewport(parseViewport(new URLSearchParams(window.location.search)));
  }, []);

  const frameSelectionInitializedRef = useRef(false);
  const lastSyncedFrameIdRef = useRef<FrameId | null>(null);
  const [viewportDiagnostics, setViewportDiagnostics] = useState<
    ReturnType<typeof validateViewport>
  >([]);

  const updateViewportUrl = (next: ViewportState) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const params = new URLSearchParams(serializeViewport(next));
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    window.history.replaceState({}, "", url);
  };

  const setPreviewViewport = (next: ViewportState) => {
    setViewport(next);
    updateViewportUrl(next);
    const editor = editorRef.current;
    if (editor) {
      editor.zoomToFit({ animation: { duration: 120 } });
    }
  };

  const syncViewportToFrame = (frameId: FrameId) => {
    const frame = document.frames?.find((item) => item.id === frameId);
    if (!frame) return;
    const next = customViewport(frame.width, frame.height, viewport.zoom);
    setViewport(next);
    updateViewportUrl(next);
    lastSyncedFrameIdRef.current = frameId;
  };

  const projection = useMemo(
    () =>
      import("@uiforge/editor").then(({ projectDocument }) =>
        projectDocument(document),
      ),
    [document],
  );
  const [projected, setProjected] = useState<Awaited<typeof projection> | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    void projection.then((value) => {
      if (active) setProjected(value);
    });
    return () => {
      active = false;
    };
  }, [projection]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !projected) return;

    const shapes = projected.shapes.map((shape) => ({
      id: shape.id,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      opacity: shape.opacity ?? 1,
      isLocked: shape.isLocked ?? false,
      props: {
        ...shape.props,
        richText: toRichText(shape.label),
      },
      meta: shape.meta,
    }));
    const projectedIds = new Set(shapes.map((shape) => shape.id));

    for (const shape of editor.getCurrentPageShapes()) {
      if (shape.meta?.source === "uiforge" && !projectedIds.has(shape.id)) {
        editor.deleteShape(shape.id);
      }
    }

    editor.createShapes(shapes.filter((shape) => !editor.getShape(shape.id)));

    for (const shape of shapes) {
      if (editor.getShape(shape.id)) editor.updateShape(shape);
    }
  }, [projected]);

  const syncCanvasSelection = (editor: Editor) => {
    const selections = editor.getSelectedShapes().flatMap((shape) => {
      const id = shape.meta?.nodeId;
      return typeof id === "string"
        ? [{ id, semanticType: shape.meta?.semanticType }]
        : [];
    });
    const nodeIds = selections
      .filter((item) => item.semanticType !== "frame")
      .map((item) => item.id as NodeId);
    const frameIds = selections
      .filter((item) => item.semanticType === "frame")
      .map((item) => item.id as FrameId);
    setSelectedNodeIds(nodeIds);
    setSelectedFrameIds(frameIds);
    setSelectedNodeId(nodeIds[0] ?? null);
    setSelectedFrameId(frameIds[0] ?? null);

    const nextFrameId = frameIds[0] ?? null;
    if (!frameSelectionInitializedRef.current) {
      frameSelectionInitializedRef.current = true;
      lastSyncedFrameIdRef.current = nextFrameId;
    } else if (nextFrameId && nextFrameId !== lastSyncedFrameIdRef.current) {
      syncViewportToFrame(nextFrameId);
    }
  };

  useEffect(() => {
    const frame = selectedFrameId
      ? document.frames?.find((item) => item.id === selectedFrameId)
      : undefined;
    if (!frame) {
      setViewportDiagnostics([]);
      return;
    }

    const nodes = Object.values(document.nodes)
      .filter((node) => node.frameId === frame.id)
      .map((node) => ({
        id: node.id,
        x: (node.editor?.x ?? 0) - frame.x,
        width: node.editor?.width ?? 0,
      }));
    setViewportDiagnostics(validateViewport(viewport.width, nodes));
  }, [document, selectedFrameId, viewport.width]);

  const experienceGraph = useMemo<ExperienceGraph>(() => {
    const transitions = Object.values(document.nodes)
      .filter((node) => node.interaction?.targetScreenId)
      .map((node) => ({
        id: `transition.${node.id}`,
        source: { screenId: node.screenId, nodeId: node.id },
        trigger: { type: "click" as const },
        action: {
          type: "navigate" as const,
          destination: { screenId: node.interaction?.targetScreenId as string },
        },
        animation: { name: "slide-right", durationMs: 250 },
      }));
    const firstScreen = document.screens[0];
    return {
      version: EXPERIENCE_GRAPH_VERSION,
      id: `runtime.${document.id}`,
      flows: [{
        id: "flow.main",
        name: "Main flow",
        screenIds: document.screens.map((screen) => screen.id),
        startingPointIds: ["start"],
        transitionIds: transitions.map((item) => item.id),
      }],
      journeys: [],
      startingPoints: firstScreen
        ? [{ id: "start", destination: { screenId: firstScreen.id } }]
        : [],
      transitions,
    };
  }, [document]);

  const layerTree = useMemo(
    () => filterLayers(buildLayerTree(document), layerQuery),
    [document, layerQuery],
  );

  const selectedSemanticId = selectedNodeId ?? selectedFrameId;

  const applySemantic = (builder: (current: UIDocument) => UIDocument) => {
    try {
      setDocument((current) => {
        const next = builder(current);
        if (next === current) return current;
        setHistoryPast((past) => [...past.slice(-49), structuredClone(current)]);
        setHistoryFuture([]);
        return next;
      });
      setInspectorError(null);
    } catch (error) {
      setInspectorError(error instanceof Error ? error.message : String(error));
    }
  };

  const undo = () => {
    setHistoryPast((past) => {
      const previous = past[past.length - 1];
      if (!previous) return past;
      setHistoryFuture((future) => [structuredClone(document), ...future.slice(0, 49)]);
      setDocument(previous);
      return past.slice(0, -1);
    });
  };

  const redo = () => {
    setHistoryFuture((future) => {
      const next = future[0];
      if (!next) return future;
      setHistoryPast((past) => [...past.slice(-49), structuredClone(document)]);
      setDocument(next);
      return future.slice(1);
    });
  };

  const selectSemanticLayer = (layer: SemanticLayer) => {
    const id = layer.nodeId ?? layer.frameId;
    if (!id || !editorRef.current) return;
    editorRef.current.select(`shape:${id}` as never);
    if (layer.kind === "frame") {
      setSelectedFrameId(id as FrameId);
      setSelectedFrameIds([id as FrameId]);
      syncViewportToFrame(id as FrameId);
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
    }
    if (layer.kind === "node") {
      setSelectedNodeId(id as NodeId);
      setSelectedNodeIds([id as NodeId]);
      setSelectedFrameId(null);
      setSelectedFrameIds([]);
    }
  };

  const updateNode = (nodeId: NodeId, patch: NodePatch) => {
    applySemantic((current) =>
      applyCommand(current, {
        type: "UpdateNode",
        commandId: `inspector.update-node.${nodeId}.${Date.now()}`,
        nodeId,
        patch,
      }),
    );
  };

  const updateFrame = (frameId: FrameId, patch: Partial<Omit<Frame, "id">>) => {
    applySemantic((current) =>
      applyCommand(current, {
        type: "UpdateFrame",
        commandId: `inspector.update-frame.${frameId}.${Date.now()}`,
        frameId,
        patch,
      }),
    );
  };

  const renameLayer = (layer: SemanticLayer) => {
    if (layer.kind !== "node" || !layer.nodeId) return;
    const nodeId = layer.nodeId;
    const node = document.nodes[nodeId];
    if (!node) return;
    const nextName = globalThis.prompt("Rename layer", layer.name)?.trim();
    if (!nextName || nextName === layer.name) return;
    updateNode(layer.nodeId, {
      ...node,
      content: { ...node.content, label: nextName },
    });
  };

  const toggleLayerVisibility = (layer: SemanticLayer) => {
    if (layer.kind !== "node" || !layer.nodeId) return;
    const node = document.nodes[layer.nodeId];
    if (!node) return;
    updateNode(layer.nodeId, {
      ...node,
      editor: { ...node.editor, visible: node.editor?.visible === false },
    });
  };

  const toggleLayerLock = (layer: SemanticLayer) => {
    if (layer.kind !== "node" || !layer.nodeId) return;
    const node = document.nodes[layer.nodeId];
    if (!node) return;
    updateNode(layer.nodeId, {
      ...node,
      editor: { ...node.editor, locked: node.editor?.locked !== true },
    });
  };

  const moveLayer = (layer: SemanticLayer, delta: number) => {
    if (layer.kind !== "node" || !layer.nodeId) return;
    const nodeId = layer.nodeId;
    const node = document.nodes[nodeId];
    if (!node?.parentId) return;
    const parent = document.nodes[node.parentId];
    if (!parent) return;
    const currentIndex = parent.childrenIds.indexOf(nodeId);
    const nextIndex = Math.max(
      0,
      Math.min(parent.childrenIds.length - 1, currentIndex + delta),
    );
    if (currentIndex < 0 || nextIndex === currentIndex) return;
    applySemantic((current) =>
      applyCommand(current, {
        type: "MoveNode",
        commandId: `layers.move-node.${nodeId}.${nextIndex}.${Date.now()}`,
        nodeId,
        toIndex: nextIndex,
      }),
    );
  };

  const renderLayer = (layer: SemanticLayer): React.ReactNode => {
    const selected = selectedSemanticId === (layer.nodeId ?? layer.frameId);
    return (
      <div key={layer.id}>
        <div
          className={`group flex items-center gap-1 rounded px-1 py-1 text-[11px] ${selected ? "bg-cyan-500/20 text-cyan-200" : "text-slate-300 hover:bg-slate-800"}`}
          style={{ paddingLeft: 6 + layer.depth * 10 }}
        >
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left"
            onClick={() => selectSemanticLayer(layer)}
            title={layer.name}
          >
            {layer.kind === "screen" ? "▾" : layer.kind === "frame" ? "▣" : "◇"}{" "}
            {layer.name}
          </button>
          {layer.kind === "node" ? (
            <>
              <button
                type="button"
                title="Rename"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => renameLayer(layer)}
              >
                ✎
              </button>
              <button
                type="button"
                title="Move up"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => moveLayer(layer, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                title="Move down"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => moveLayer(layer, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                title="Toggle visibility"
                className="opacity-70"
                onClick={() => toggleLayerVisibility(layer)}
              >
                {layer.visible ? "◉" : "○"}
              </button>
              <button
                type="button"
                title="Toggle lock"
                className="opacity-70"
                onClick={() => toggleLayerLock(layer)}
              >
                {layer.locked ? "🔒" : "🔓"}
              </button>
            </>
          ) : null}
        </div>
        {layer.children.map(renderLayer)}
      </div>
    );
  };

  const addFrame = (presetId: string) => {
    const index = (document.frames ?? []).length;
    const preset = FRAME_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    const next = createFrameFromPreset(
      `frame.dashboard.${presetId}.${index}` as FrameId,
      "screen.dashboard",
      presetId,
      80 + (index % 3) * 440,
      80 + Math.floor(index / 3) * 920,
    );

    applySemantic((current) =>
      applyCommand(current, {
        type: "CreateFrame",
        commandId: `editor.create-frame.${presetId}.${index}`,
        frame: next,
      }),
    );
  };

  const addCustomFrame = () => {
    const width = Number(customFrame.width);
    const height = Number(customFrame.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    if (width <= 0 || height <= 0) return;

    const index = (document.frames ?? []).length;
    const id = `frame.dashboard.custom.${Date.now()}.${index}` as FrameId;
    const orientation = width <= height ? "portrait" : "landscape";

    applySemantic((current) =>
      applyCommand(current, {
        type: "CreateFrame",
        commandId: `editor.create-frame.custom.${Date.now()}`,
        frame: {
          id,
          screenId: "screen.dashboard",
          presetId: "custom",
          name: `Custom ${width} × ${height}`,
          x: 80 + (index % 3) * 440,
          y: 80 + Math.floor(index / 3) * 920,
          width,
          height,
          orientation,
          presetVersion: "uiforge.frame-presets/v1",
        },
      }),
    );
    setCustomFrame((current) => ({ ...current, open: false }));
  };

  const updateSelectedEditor = (
    mutate: (
      editor: NonNullable<UIDocument["nodes"][string]["editor"]>,
    ) => NonNullable<UIDocument["nodes"][string]["editor"]>,
  ) => {
    if (!selectedNodeIds.length) return;
    applySemantic((current) =>
      selectedNodeIds.reduce((doc, nodeId) => {
        const node = doc.nodes[nodeId];
        if (!node) return doc;
        return applyCommand(doc, {
          type: "UpdateNode",
          commandId: `inspector.multi-editor.${nodeId}.${Date.now()}`,
          nodeId,
          patch: { editor: mutate(node.editor ?? {}) },
        });
      }, current),
    );
  };

  const updateLayoutToken = (slot: "gap" | "padding", token: string) => {
    if (!primaryNode || isMultiNode || !token) return;
    const nextLayout = { ...primaryNode.layout };
    if (slot === "gap") {
      nextLayout.gap = { token };
    } else {
      nextLayout.padding = {
        ...nextLayout.padding,
        inline: { token },
      };
    }
    updateNode(primaryNode.id, { layout: nextLayout });
  };

  const updateSelectedToken = (slot: string, token: string) => {
    if (!token) return;
    const [nodeId] = selectedNodeIds;
    if (selectedNodeIds.length === 1 && nodeId) {
      applySemantic((current) =>
        applyCommand(current, {
          type: "SetToken",
          commandId: `inspector.token.${nodeId}.${slot}.${Date.now()}`,
          nodeId,
          slot,
          token,
        }),
      );
      return;
    }
    if (selectedNodeIds.length > 1) {
      applySemantic((current) =>
        selectedNodeIds.reduce(
          (doc, nodeId) =>
            applyCommand(doc, {
              type: "SetToken",
              commandId: `inspector.multi-token.${nodeId}.${slot}.${Date.now()}`,
              nodeId,
              slot,
              token,
            }),
          current,
        ),
      );
    }
  };

  const updateResponsiveRule = (
    nodeId: NodeId,
    breakpoint: string,
    patch: Partial<ResponsiveRule>,
  ) => {
    const node = document.nodes[nodeId];
    if (!node) return;
    const current = findResponsiveRule(node, breakpoint);
    const nextRule: ResponsiveRule = {
      breakpoint,
      ...(current ?? {}),
      ...patch,
    };
    if (
      nextRule.minWidth !== undefined &&
      nextRule.maxWidth !== undefined &&
      nextRule.minWidth > nextRule.maxWidth
    ) {
      setInspectorError(`${breakpoint}: minimum width cannot exceed maximum width.`);
      return;
    }
    applySemantic((currentDocument) =>
      applyCommand(currentDocument, {
        type: "SetResponsiveRule",
        commandId: `inspector.responsive.${nodeId}.${breakpoint}.${Date.now()}`,
        nodeId,
        rule: nextRule,
      }),
    );
  };

  const resetSelection = () => {
    const original = initialDocumentRef.current;
    if (selectedNodeIds.length) {
      applySemantic((current) =>
        selectedNodeIds.reduce((doc, nodeId) => {
          const source = original.nodes[nodeId];
          return source
            ? applyCommand(doc, {
                type: "UpdateNode",
                commandId: `inspector.reset-node.${nodeId}.${Date.now()}`,
                nodeId,
                patch: structuredClone(source),
              })
            : doc;
        }, current),
      );
      return;
    }
    const frameId = selectedFrameIds[0];
    const source = original.frames?.find((frame) => frame.id === frameId);
    if (frameId && source) {
      updateFrame(frameId, structuredClone(source));
    }
  };

  const inspectorNodeIds = selectedNodeIds.length
    ? selectedNodeIds
    : selectedNodeId
      ? [selectedNodeId]
      : [];
  const inspectorNodes = inspectorNodeIds
    .map((id) => document.nodes[id])
    .filter((node): node is NonNullable<typeof node> => Boolean(node));
  const primaryNode = inspectorNodes[0];
  const primaryFrame =
    !inspectorNodes.length && selectedFrameId
      ? document.frames?.find((frame) => frame.id === selectedFrameId)
      : undefined;
  const isMultiNode = inspectorNodes.length > 1;
  const commonSlots = commonTokenSlots(inspectorNodes);
  const diagnostics = primaryNode
    ? inspectorNodes.flatMap(inspectNode)
    : primaryFrame
      ? inspectFrame(primaryFrame)
      : [];
  const tokenSelect = (slot: string, value?: string) => (
    <select
      aria-label={slot}
      value={value ?? ""}
      onChange={(event) => updateSelectedToken(slot, event.target.value)}
      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200"
    >
      <option value="">Unset</option>
      {TOKEN_OPTIONS.map((token) => (
        <option key={token.name} value={token.name}>
          {token.name}
        </option>
      ))}
    </select>
  );
  const layoutTokenSelect = (slot: "gap" | "padding", value?: string) => (
    <select
      aria-label={`layout.${slot}`}
      value={value ?? ""}
      onChange={(event) => updateLayoutToken(slot, event.target.value)}
      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200"
    >
      <option value="">Unset</option>
      {TOKEN_OPTIONS.filter((token) => token.kind === "spacing").map((token) => (
        <option key={token.name} value={token.name}>{token.name}</option>
      ))}
    </select>
  );

  const renderInspector = () => {
    if (!primaryNode && !primaryFrame) {
      return (
        <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">
          Select a Frame, Section, Component or Layer
        </div>
      );
    }

    if (primaryFrame) {
      return (
        <div className="space-y-4">
          <InspectorSection title="Selection">
            <div className="font-medium text-slate-100">{primaryFrame.name}</div>
            <div className="text-[10px] text-slate-500">Frame · {primaryFrame.presetId}</div>
          </InspectorSection>
          <InspectorSection title="Layout">
            <NumberPair label="X" value={primaryFrame.x} onCommit={(value) => updateFrame(primaryFrame.id, { x: value })} />
            <NumberPair label="Y" value={primaryFrame.y} onCommit={(value) => updateFrame(primaryFrame.id, { y: value })} />
            <NumberPair label="W" value={primaryFrame.width} min={1} onCommit={(value) => updateFrame(primaryFrame.id, { width: value })} />
            <NumberPair label="H" value={primaryFrame.height} min={1} onCommit={(value) => updateFrame(primaryFrame.id, { height: value })} />
          </InspectorSection>
          <InspectorSection title="Metadata">
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
              <span>Preset</span><span className="text-right text-slate-300">{primaryFrame.presetId}</span>
              <span>Orientation</span><span className="text-right text-slate-300">{primaryFrame.orientation}</span>
            </div>
          </InspectorSection>
          <InspectorDiagnostics diagnostics={diagnostics} />
          <ResetButton onClick={resetSelection} />
        </div>
      );
    }

    if (!primaryNode) return null;
    const layout = primaryNode.layout;
    const token = (slot: string) => primaryNode.style?.tokens?.[slot];
    return (
      <div className="space-y-4">
        <InspectorSection title="Selection">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-100">
                {isMultiNode ? `${inspectorNodes.length} layers` : nodeLabel(primaryNode)}
              </div>
              <div className="text-[10px] text-slate-500">
                {isMultiNode ? "Common properties" : primaryNode.type}
              </div>
            </div>
            <span className="text-cyan-300">◇</span>
          </div>
        </InspectorSection>

        <InspectorSection title="Layout">
          {isMultiNode ? (
            <>
              <NumberPair label="W" value={primaryNode.editor?.width ?? 0} min={1} onCommit={(value) => updateSelectedEditor((editor) => ({ ...editor, width: value }))} />
              <NumberPair label="H" value={primaryNode.editor?.height ?? 0} min={1} onCommit={(value) => updateSelectedEditor((editor) => ({ ...editor, height: value }))} />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
                <NumberPair label="X" value={primaryNode.editor?.x ?? 0} onCommit={(value) => updateNode(primaryNode.id, { editor: { ...primaryNode.editor, x: value } })} />
                <NumberPair label="Y" value={primaryNode.editor?.y ?? 0} onCommit={(value) => updateNode(primaryNode.id, { editor: { ...primaryNode.editor, y: value } })} />
                <NumberPair label="W" value={primaryNode.editor?.width ?? 0} min={1} onCommit={(value) => updateNode(primaryNode.id, { editor: { ...primaryNode.editor, width: value } })} />
                <NumberPair label="H" value={primaryNode.editor?.height ?? 0} min={1} onCommit={(value) => updateNode(primaryNode.id, { editor: { ...primaryNode.editor, height: value } })} />
              </div>
          )}
          <label className="block text-[10px] text-slate-500">
            Auto layout
            <select
              aria-label="Layout mode"
              value={layout.mode}
              disabled={isMultiNode}
              onChange={(event) => updateNode(primaryNode.id, { layout: { ...layout, mode: event.target.value as typeof layout.mode } })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200"
            >
              {["stack", "flex", "grid", "absolute"].map((mode) => <option key={mode}>{mode}</option>)}
            </select>
          </label>
          {!isMultiNode && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Gap">{layoutTokenSelect("gap", layout.gap?.token)}</Field>
              <Field label="Padding">{layoutTokenSelect("padding", layout.padding?.inline?.token)}</Field>
            </div>
          )}
        </InspectorSection>

        <InspectorSection title="Typography & Appearance">
          <Field label="Typography">{tokenSelect("typography", token("typography"))}</Field>
          <Field label="Fill">{tokenSelect("fill", token("fill"))}</Field>
          <Field label="Border">{tokenSelect("border", token("border"))}</Field>
          <Field label="Radius">{tokenSelect("radius", token("radius"))}</Field>
          <Field label="Shadow">{tokenSelect("shadow", token("shadow"))}</Field>
        </InspectorSection>

        <InspectorSection title="Visibility">
          <div className="flex items-center justify-between">
            <Toggle
              label="Visible"
              checked={primaryNode.editor?.visible !== false}
              onChange={(checked) => updateSelectedEditor((editor) => ({ ...editor, visible: checked }))}
            />
            <Toggle
              label="Locked"
              checked={primaryNode.editor?.locked === true}
              onChange={(checked) => updateSelectedEditor((editor) => ({ ...editor, locked: checked }))}
            />
          </div>
        </InspectorSection>

        {!isMultiNode && primaryNode.component ? (
          <InspectorSection title="Component">
            <div className="mb-2 text-[10px] text-slate-500">{primaryNode.component.registryId}</div>
            <input
              aria-label="Component variant"
              value={primaryNode.component.variant ?? ""}
              onChange={(event) =>
                applySemantic((current) =>
                  applyCommand(current, {
                    type: "SetVariant",
                    commandId: `inspector.variant.${primaryNode.id}.${Date.now()}`,
                    nodeId: primaryNode.id,
                    variant: event.target.value,
                  }),
                )
              }
              placeholder="variant"
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200"
            />
          </InspectorSection>
        ) : null}

        {!isMultiNode ? (
          <InspectorSection title="Responsive">
            <div className="space-y-2">
              {BREAKPOINTS.map((breakpoint) => {
                const rule = findResponsiveRule(primaryNode, breakpoint);
                return (
                  <div key={breakpoint} className="grid grid-cols-[36px_1fr_auto] items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-300">{breakpoint}</span>
                    <input
                      aria-label={`${breakpoint} min width`}
                      type="number"
                      min={0}
                      value={rule?.minWidth ?? ""}
                      onChange={(event) => updateResponsiveRule(primaryNode.id, breakpoint, { minWidth: event.target.value ? Number(event.target.value) : undefined })}
                      placeholder="min"
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-200"
                    />
                    <label className="flex items-center gap-1 text-[10px] text-slate-500">
                      <input
                        type="checkbox"
                        checked={rule?.hidden === true}
                        onChange={(event) => updateResponsiveRule(primaryNode.id, breakpoint, { hidden: event.target.checked })}
                      />
                      hide
                    </label>
                  </div>
                );
              })}
            </div>
          </InspectorSection>
        ) : null}

        <InspectorSection title="Semantic metadata">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <span className="text-slate-500">ID</span><span className="truncate text-right text-slate-300">{primaryNode.id}</span>
            <span className="text-slate-500">Parent</span><span className="truncate text-right text-slate-300">{primaryNode.parentId ?? "root"}</span>
            <span className="text-slate-500">Frame</span><span className="truncate text-right text-slate-300">{primaryNode.frameId ?? "none"}</span>
          </div>
          {commonSlots.length ? <p className="mt-2 text-[10px] text-slate-500">Common token slots: {commonSlots.join(", ")}</p> : null}
        </InspectorSection>

        <InspectorDiagnostics diagnostics={diagnostics} />
        {inspectorError ? (
          <div
            data-testid="design-error"
            className="rounded border border-red-500/40 bg-red-500/10 p-2 text-[10px] text-red-300"
          >
            {inspectorError}
          </div>
        ) : null}
        <ResetButton onClick={resetSelection} />
      </div>
    );
  };

  const designUi = () => {
    if ((document.metadata.designStage ?? "wireframe") !== "wireframe") return;
    setDesignBusy(true);
    try {
      const proposal = buildVisualDesignProposal(document);
      const next = applyCommand(document, {
        type: "ApplyVisualDesign",
        commandId: `design-ui.${document.revision.revision + 1}`,
        patches: proposal.patches,
        stage: "visual",
      });
      setHistoryPast((past) => [
        ...past.slice(-49),
        structuredClone(document),
      ]);
      setHistoryFuture([]);
      setDocument(next);
      setInspectorError(null);
    } catch (error) {
      setInspectorError(error instanceof Error ? error.message : String(error));
    } finally {
      setDesignBusy(false);
    }
  };

  const enterPresent = () => {
    try {
      setPrototypeSession(createPrototypeSession(experienceGraph));
      setPresent(true);
    } catch (error) {
      setInspectorError(error instanceof Error ? error.message : String(error));
    }
  };

  const exitPresent = () => {
    setPresent(false);
    setPrototypeSession(null);
  };

  const activateHotspot = (nodeId: NodeId) => {
    if (!prototypeSession) return;
    const result = resolveTransition(
      experienceGraph,
      prototypeSession,
      { screenId: prototypeSession.current.screenId, nodeId },
    );
    if (result) setPrototypeSession(result.session);
  };

  const renderPrototypeNode = (node: UIDocument["nodes"][string]) => {
    const label =
      node.content?.label ??
      node.content?.text ??
      node.content?.placeholder ??
      node.type;
    const interactive = Boolean(node.interaction?.targetScreenId);
    const activate = interactive ? () => activateHotspot(node.id) : undefined;
    const focusRing = interactive
      ? "cursor-pointer ring-1 ring-blue-300/70 hover:ring-blue-500"
      : "";

    if (node.type === "text") {
      return (
        <div key={node.id} className="space-y-1">
          <div className="text-lg font-semibold tracking-tight text-slate-900">{label}</div>
          {node.content?.description ? (
            <div className="text-sm leading-5 text-slate-500">{node.content.description}</div>
          ) : null}
        </div>
      );
    }

    if (node.type === "input") {
      return (
        <div key={node.id} className={`space-y-1 ${focusRing}`}>
          <div className="text-xs font-medium text-slate-600">{label}</div>
          <input
            aria-label={label}
            readOnly
            placeholder={node.content?.placeholder}
            value={node.content?.value ?? ""}
            onChange={() => undefined}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none"
          />
        </div>
      );
    }

    if (node.type === "button") {
      return (
        <button
          key={node.id}
          type="button"
          onClick={activate}
          className="h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {label}
        </button>
      );
    }

    if (node.type === "image") {
      if (interactive) {
        return (
          <button
            key={node.id}
            type="button"
            onClick={activate}
            className={`flex min-h-32 w-full items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400 ${focusRing}`}
          >
            {node.content?.alt ?? "Image"}
          </button>
        );
      }
      return (
        <div
          key={node.id}
          className="flex min-h-32 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400"
        >
          {node.content?.alt ?? "Image"}
        </div>
      );
    }

    const content = (
      <>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {node.content?.description ? (
          <div className="mt-1 text-xs leading-5 text-slate-500">{node.content.description}</div>
        ) : null}
      </>
    );

    if (node.type === "card") {
      if (interactive) {
        return (
          <button
            key={node.id}
            type="button"
            onClick={activate}
            className={`w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm ${focusRing}`}
          >
            {content}
          </button>
        );
      }
      return (
        <div
          key={node.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          {content}
        </div>
      );
    }

    if (interactive) {
      return (
        <button
          key={node.id}
          type="button"
          onClick={activate}
          className={`w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left ${focusRing}`}
        >
          {content}
        </button>
      );
    }

    return (
      <div
        key={node.id}
        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        {content}
      </div>
    );
  };

  const addSection = () => {
    const root = document.nodes["screen.dashboard.root"];
    if (!root) return;

    const selectedFrame =
      (document.frames ?? []).find((frame) => frame.id === selectedFrameId) ??
      document.frames?.[0];

    const id = `section.dashboard.${Date.now()}`;
    applySemantic((current) =>
      applyCommand(current, {
        type: "CreateNode",
        commandId: `editor.create-section.${id}`,
        node: {
          id,
          screenId: root.screenId,
          frameId: selectedFrame?.id,
          parentId: root.id,
          childrenIds: [],
          type: "section",
          layout: {
            mode: "stack",
            direction: "column",
            gap: { token: "space.4" },
          },
          editor: {
            x: selectedFrame?.x ?? 120,
            y: selectedFrame?.y ?? 160,
            width: Math.min(318, selectedFrame?.width ?? 318),
            height: Math.min(420, selectedFrame?.height ?? 420),
          },
          content: { label: "New Section" },
        },
      }),
    );
  };

  return (
    <div
      className="h-[820px] w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950"
      data-testid="uiforge-editor-workspace"
    >
      <header className="flex h-12 items-center border-b border-slate-800 bg-slate-900 px-4 text-xs">
        <strong className="mr-6 text-sm text-white">UIForge</strong>
        <span className="text-slate-400">Expense App</span>

        <div className="mr-3 flex items-center gap-1">
          <button type="button" aria-label="Undo" disabled={!historyPast.length} onClick={undo} className="rounded px-2 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30">↶</button>
          <button type="button" aria-label="Redo" disabled={!historyFuture.length} onClick={redo} className="rounded px-2 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30">↷</button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="rounded-md px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            type="button"
          >
            ↖ Select
          </button>
          <button
            className="rounded-md px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            type="button"
            onClick={addSection}
          >
            Section
          </button>

          <details className="relative" data-testid="frame-menu">
            <summary className="cursor-pointer list-none rounded-md bg-cyan-500 px-3 py-1.5 font-medium text-slate-950">
              Frame +
            </summary>

            <div
              className="absolute right-0 top-9 z-20 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
              data-testid="frame-preset-menu"
            >
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Add Frame
              </p>

              {(["mobile", "tablet", "android", "desktop"] as const).map(
                (category) => (
                  <div key={category}>
                    <p className="px-2 pt-2 text-[10px] uppercase text-slate-500">
                      {category}
                    </p>

                    {FRAME_PRESETS.filter(
                      (item) => item.category === category,
                    ).map((item) => (
                      <button
                        key={item.id}
                        className="flex w-full justify-between rounded px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800"
                        type="button"
                        onClick={() => addFrame(item.id)}
                      >
                        <span>{item.name}</span>
                        <span className="text-slate-500">
                          {item.width}×{item.height}
                        </span>
                      </button>
                    ))}
                  </div>
                ),
              )}

              <button
                className="mt-1 w-full rounded px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                type="button"
                onClick={() =>
                  setCustomFrame((current) => ({ ...current, open: true }))
                }
              >
                Custom…
              </button>
            </div>
          </details>

          <button
            className="rounded-md px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            type="button"
          >
            Component
          </button>
          <div className="ml-3 flex items-center rounded-md border border-slate-700 bg-slate-950 p-0.5" data-testid="design-stage-switcher">
            {(["wireframe", "visual"] as const).map((stage) => (
              <span key={stage} className={`rounded px-2 py-1 text-[10px] ${(document.metadata.designStage ?? "wireframe") === stage ? "bg-slate-700 text-white" : "text-slate-500"}`}>
                {stage === "wireframe" ? "Wireframe" : "Visual Design"}
              </span>
            ))}
          </div>
          <button type="button" data-testid="design-ui" disabled={(document.metadata.designStage ?? "wireframe") !== "wireframe" || designBusy} onClick={designUi} className="rounded-md bg-cyan-500 px-3 py-1.5 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
            {designBusy ? "Designing…" : "✨ Design UI"}
          </button>
          <button type="button" data-testid="present-button" onClick={enterPresent} className="rounded-md px-3 py-1.5 text-slate-200 hover:bg-slate-800">
            ▶ Present
          </button>
        </div>
      </header>

      <div className="grid h-[728px] grid-cols-[190px_1fr_220px]">
        <aside className="border-r border-slate-800 bg-slate-900/70 p-3 text-xs">
          <p className="mb-2 font-semibold text-slate-400">SCREENS</p>
          {document.screens.map((screen) => (
            <div
              key={screen.id}
              className="rounded-md bg-slate-800 px-2 py-2 text-slate-200"
            >
              {screen.name}
            </div>
          ))}

          <p className="mb-2 mt-5 font-semibold text-slate-400">FLOW</p>
          <div className="space-y-1 text-slate-400">
            ● Dashboard
            <br />
            ↓
            <br />● Mobile List
          </div>
          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-slate-400">LAYERS</p>
              <span className="text-[10px] text-slate-600">
                {Object.keys(document.nodes).length}
              </span>
            </div>
            <input
              aria-label="Search layers"
              value={layerQuery}
              onChange={(event) => setLayerQuery(event.target.value)}
              placeholder="Search layers…"
              className="mb-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-cyan-500"
            />
            <div className="max-h-[500px] overflow-auto">
              {layerTree.map(renderLayer)}
            </div>
          </div>
        </aside>

        <main className="relative min-w-0 bg-[#111827]" data-testid="responsive-device-preview">
          <div className="absolute left-3 right-3 top-3 z-10 rounded-xl border border-slate-700 bg-slate-900/95 p-2 shadow-xl backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-slate-500">DEVICE</span>
              <details className="relative" data-testid="device-menu">
                <summary
                  data-testid="device-preset-trigger"
                  className="cursor-pointer list-none rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200"
                >
                  {DEVICE_PRESETS.find((item) => item.id === viewport.presetId)?.name ?? "Custom"} ▾
                </summary>
                <div className="absolute left-0 top-9 z-30 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                  {(["mobile", "tablet", "desktop"] as const).map((category) => (
                    <div key={category}>
                      <p className="px-2 pt-2 text-[10px] uppercase tracking-wider text-slate-500">
                        {category === "mobile" ? "iPhone" : category}
                      </p>
                      {DEVICE_PRESETS.filter((item) => item.category === category).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full justify-between rounded px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800"
                          onClick={(event) => {
                            setPreviewViewport(viewportFromPreset(item.id, viewport.orientation));
                            event.currentTarget.closest("details")?.removeAttribute("open");
                          }}
                        >
                          <span>{item.name}</span>
                          <span className="text-slate-500">{item.width}×{item.height}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 w-full rounded px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                    onClick={(event) => {
                      const width = Number(globalThis.prompt("Viewport width", String(viewport.width)));
                      const height = Number(globalThis.prompt("Viewport height", String(viewport.height)));
                      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
                        setPreviewViewport(customViewport(width, height, viewport.zoom));
                      }
                      event.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    Custom…
                  </button>
                </div>
              </details>
              <button
                type="button"
                aria-label="Toggle orientation"
                data-testid="viewport-orientation"
                onClick={() => setPreviewViewport(rotateViewport(viewport))}
                className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-slate-300"
              >
                {viewport.orientation === "portrait" ? "Portrait ↕" : "Landscape ↔"}
              </button>
              <span className="font-mono text-slate-400" data-testid="viewport-size">
                {viewport.width} × {viewport.height}
              </span>
              <label className="flex items-center gap-1 text-slate-500">
                Zoom
                <select
                  aria-label="Viewport zoom"
                  value={viewport.zoom}
                  onChange={(event) => setPreviewViewport({ ...viewport, zoom: Number(event.target.value) })}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
                >
                  {ZOOM_PRESETS.map((zoom) => <option key={zoom} value={zoom}>{zoom}%</option>)}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  const editor = editorRef.current;
                  if (editor) editor.zoomToFit({ animation: { duration: 150 } });
                }}
                className="rounded-md border border-slate-700 px-2.5 py-1.5 text-slate-300 hover:bg-slate-800"
              >
                Fit
              </button>
              <span className="ml-auto text-[10px] text-slate-500">
                Preview state only · not persisted to UI Schema
              </span>
            </div>
          </div>
          <Tldraw
            onMount={(editor) => {
              editorRef.current = editor;
              editor.setCurrentTool("select");

              const sync = () => syncCanvasSelection(editor);
              const unsubscribe = editor.store.listen(
                (entry) => {
                  for (const [, [, next]] of Object.entries(
                    entry.changes.updated,
                  )) {
                    if (next.typeName !== "shape" || next.type !== "geo") {
                      continue;
                    }

                    const meta = next.meta as {
                      semanticType?: unknown;
                      nodeId?: unknown;
                    };
                    if (
                      meta.semanticType !== "frame" ||
                      typeof meta.nodeId !== "string"
                    ) {
                      continue;
                    }

                    const frameId = meta.nodeId as FrameId;
                    applySemantic((current) => {
                      const frame = current.frames?.find(
                        (item) => item.id === frameId,
                      );
                      if (!frame) return current;
                      return applyCommand(current, {
                        type: "UpdateFrame",
                        commandId: `canvas.update-frame.${frameId}.${Math.round(next.x)}.${Math.round(next.y)}`,
                        frameId,
                        patch: {
                          x: next.x,
                          y: next.y,
                          width: next.props.w,
                          height: next.props.h,
                        },
                      });
                    });
                  }

                  sync();
                },
                { source: "user", scope: "document" },
              );

              editor.on("change", sync);
              sync();

              if (projected) {
                editor.createShapes(
                  projected.shapes.map((shape) => ({
                    id: shape.id,
                    type: shape.type,
                    x: shape.x,
                    y: shape.y,
                    opacity: shape.opacity ?? 1,
                    isLocked: shape.isLocked ?? false,
                    props: {
                      ...shape.props,
                      richText: toRichText(shape.label),
                    },
                    meta: shape.meta,
                  })),
                );
                editor.zoomToFit({ animation: { duration: 0 } });
              }

              return () => {
                unsubscribe();
                editor.off("change", sync);
              };
            }}
          />
          <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-slate-700 bg-slate-900/95 p-2 shadow-xl" data-testid="responsive-validation">
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Responsive validation</span>
              {(["mobile", "tablet", "desktop", "wide"] as const).map((breakpoint) => {
                const currentWidth = viewport.width;
                const valid =
                  breakpoint === "mobile" ? currentWidth <= 767 :
                  breakpoint === "tablet" ? currentWidth >= 768 && currentWidth <= 1023 :
                  breakpoint === "desktop" ? currentWidth >= 1024 && currentWidth <= 1439 :
                  currentWidth >= 1440;
                return (
                  <span key={breakpoint} className={valid ? "text-emerald-300" : "text-slate-600"}>
                    {valid ? "✓" : "○"} {breakpoint}
                  </span>
                );
              })}
              {viewportDiagnostics.map((diagnostic) => (
                <span
                  key={diagnostic.code + diagnostic.message}
                  className={diagnostic.severity === "error" ? "text-red-300" : diagnostic.severity === "warning" ? "text-amber-300" : "text-emerald-300"}
                  data-testid={`viewport-diagnostic-${diagnostic.code.toLowerCase()}`}
                >
                  {diagnostic.severity === "ok" ? "✓" : "⚠"} {diagnostic.message}
                </span>
              ))}
            </div>
          </div>
        </main>

        <aside className="border-l border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300" data-testid="semantic-inspector">
          <div className="mb-3 flex gap-3 border-b border-slate-800 pb-2">
            <b className="text-slate-100">Design</b>
            <span className="text-slate-500">Prototype</span>
          </div>
          <div className="max-h-[680px] overflow-auto pr-1">
            {renderInspector()}
          </div>
        </aside>
      </div>

      <footer className="flex h-12 items-center gap-2 border-t border-slate-800 bg-slate-900 px-3 text-xs text-slate-300">
        <span className="mr-2 text-cyan-300">✨ Ask UIForge…</span>
        <span className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-500">
          {(document.metadata.designStage ?? "wireframe") === "wireframe" ? "Structural wireframe" : "Editable visual design"}
        </span>
        <button
          type="button"
          className="rounded px-2 py-1 hover:bg-slate-800"
          onClick={() => {
            globalThis.document
              .querySelector<HTMLDetailsElement>("[data-testid='frame-menu']")
              ?.setAttribute("open", "");
          }}
        >
          + Frame
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 hover:bg-slate-800"
          onClick={addSection}
        >
          + Section
        </button>
        <button type="button" className="rounded px-2 py-1 hover:bg-slate-800">
          + Component
        </button>
        <span className="ml-auto text-slate-500">
          {projected?.shapes.length ?? 0} projected shapes · 85%
        </span>
      </footer>

      {present && prototypeSession ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-white" data-testid="prototype-runner">
          <header className="flex h-12 items-center justify-between border-b border-slate-800 px-5">
            <strong>UIForge</strong>
            <span className="text-xs text-slate-400">Prototype · {document.metadata.designStage === "visual" ? "Visual Design" : "Wireframe"}</span>
            <button type="button" onClick={exitPresent} className="rounded px-3 py-1.5 text-xs hover:bg-slate-800">✕ Exit</button>
          </header>
          <main className="flex flex-1 items-center justify-center overflow-auto p-8">
            <div className="w-[390px] min-h-[620px] overflow-hidden rounded-[32px] border border-slate-600 bg-white text-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-[11px]">
                <span>9:41</span>
                <span>{document.screens.find((s) => s.id === prototypeSession.current.screenId)?.name ?? "Prototype"}</span>
              </div>
              <div className="space-y-4 p-5">
                {Object.values(document.nodes)
                  .filter(
                    (node) =>
                      node.screenId === prototypeSession.current.screenId &&
                      node.type !== "screen-root",
                  )
                  .map(renderPrototypeNode)}
              </div>
            </div>
          </main>
          <footer className="flex h-12 items-center justify-center gap-8 border-t border-slate-800 text-xs text-slate-400">
            <button type="button" onClick={() => setPrototypeSession((current) => (current ? goBack(current) : current))} className="rounded px-3 py-1.5 hover:bg-slate-800">← Back</button>
            <span>{prototypeSession.history.length + 1} / {document.screens.length}</span>
          </footer>
        </div>
      ) : null}

      {customFrame.open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Create custom frame"
        >
          <div className="w-80 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <h2 className="text-sm font-semibold text-white">Custom frame</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">
                Width
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
                  inputMode="numeric"
                  value={customFrame.width}
                  onChange={(event) =>
                    setCustomFrame((current) => ({
                      ...current,
                      width: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-xs text-slate-400">
                Height
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
                  inputMode="numeric"
                  value={customFrame.height}
                  onChange={(event) =>
                    setCustomFrame((current) => ({
                      ...current,
                      height: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() =>
                  setCustomFrame((current) => ({ ...current, open: false }))
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-cyan-500 px-3 py-1.5 text-xs font-medium text-slate-950"
                onClick={addCustomFrame}
              >
                Create frame
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
