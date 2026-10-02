"use client";

import {
  applyCommand,
  createFrameFromPreset,
  dashboardFixture,
  FRAME_PRESETS,
  type FrameId,
  type UIDocument,
} from "@uiforge/ui-schema";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Editor, Tldraw, toRichText } from "tldraw";
import "tldraw/tldraw.css";

const cloneDocument = (): UIDocument => structuredClone(dashboardFixture);

type CustomFrameDraft = {
  open: boolean;
  width: string;
  height: string;
};

export default function EditorCanvas() {
  const [document, setDocument] = useState<UIDocument>(() => cloneDocument());
  const [selectedFrameId, setSelectedFrameId] = useState<FrameId | null>(null);
  const [customFrame, setCustomFrame] = useState<CustomFrameDraft>({
    open: false,
    width: "390",
    height: "844",
  });
  const editorRef = useRef<Editor | null>(null);

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
      props: {
        w: shape.props.w,
        h: shape.props.h,
        geo: shape.props.geo,
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
    const selected = editor
      .getSelectedShapes()
      .find((shape) => shape.meta?.semanticType === "frame");
    setSelectedFrameId((selected?.meta?.nodeId as FrameId | undefined) ?? null);
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

    setDocument((current) =>
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

    setDocument((current) =>
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

  const addSection = () => {
    const root = document.nodes["screen.dashboard.root"];
    if (!root) return;

    const selectedFrame =
      (document.frames ?? []).find((frame) => frame.id === selectedFrameId) ??
      document.frames?.[0];

    const id = `section.dashboard.${Date.now()}`;
    setDocument((current) =>
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
          <span className="ml-3 text-slate-500">▶ Present</span>
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
        </aside>

        <main className="relative min-w-0 bg-[#111827]">
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
                    if (meta.semanticType !== "frame" || typeof meta.nodeId !== "string") {
                      continue;
                    }

                    const frameId = meta.nodeId as FrameId;
                    setDocument((current) => {
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
                    props: {
                      w: shape.props.w,
                      h: shape.props.h,
                      geo: shape.props.geo,
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
        </main>

        <aside className="border-l border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300">
          <div className="mb-3 flex gap-3 border-b border-slate-800 pb-2">
            <b>Design</b>
            <span className="text-slate-500">Prototype</span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Canvas
          </p>
          <p className="mt-1">Infinite workspace</p>
          <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-500">
            Frames
          </p>
          <p className="mt-1">{document.frames?.length ?? 0} semantic frames</p>
          <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-500">
            Selected frame
          </p>
          <p className="mt-1 text-cyan-300">{selectedFrameId ?? "None"}</p>
          <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-500">
            Sections
          </p>
          <p className="mt-1">
            {
              Object.values(document.nodes).filter(
                (node) => node.type === "section",
              ).length
            }{" "}
            sections
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-500">
            Source of truth
          </p>
          <p className="mt-1 text-cyan-300">UI Schema</p>
          <p className="mt-1 text-slate-500">tldraw = projection</p>
        </aside>
      </div>

      <footer className="flex h-12 items-center gap-2 border-t border-slate-800 bg-slate-900 px-3 text-xs text-slate-300">
        <span className="mr-2 text-cyan-300">✨ Ask UIForge…</span>
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
