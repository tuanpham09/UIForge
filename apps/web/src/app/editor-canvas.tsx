"use client";

import { useMemo } from "react";
import { createShapeId, Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { buildMultiScreenWorkspace } from "./projection-multi";

interface EditorCanvasProps {
  onSelectScreen?: (screenId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  activeScreenId?: string;
  selectedNodeId?: string | null;
}

export default function EditorCanvas({
  onSelectScreen,
  onSelectNode,
}: EditorCanvasProps) {
  const multiScreen = useMemo(() => buildMultiScreenWorkspace(), []);

  return (
    <div
      className="relative isolate flex h-full min-h-[500px] w-full flex-col overflow-hidden bg-slate-950"
      data-testid="uiforge-editor-canvas"
    >
      <div className="flex-1">
        <Tldraw
          onMount={(editor) => {
            // Check if multi-screen flow is already present
            const flowId = createShapeId("flow:login_to_dashboard");
            const hasMultiScreen = editor.getShape(flowId) !== undefined;

            if (!hasMultiScreen) {
              const existingIds = Array.from(editor.getCurrentPageShapeIds());
              if (existingIds.length > 0) {
                editor.deleteShapes(existingIds);
              }
              editor.createShapes(multiScreen.shapes);
              editor.zoomToFit({ animation: { duration: 300 } });
            }

            // Listen to shape selection on Canvas to sync with Studio preview and inspector
            editor.store.listen(() => {
              const selected = editor.getSelectedShapes();
              if (selected.length > 0) {
                const primary = selected[0];
                const screenId = primary?.meta?.screenId as string | undefined;
                const nodeId = primary?.meta?.nodeId as string | undefined;
                if (screenId && onSelectScreen) {
                  onSelectScreen(screenId);
                }
                if (nodeId && onSelectNode) {
                  onSelectNode(nodeId);
                }
              }
            });
          }}
        />
      </div>

      <div
        className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-2 text-xs text-slate-300"
        data-testid="editor-projection-status"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            {multiScreen.screenCount} Screens · {multiScreen.flowCount} Workflow
            Connectors
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {multiScreen.nodeCount} UI Components
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          Spatial Canvas: tldraw 5.4.2 · Figma-Style Workflow Projection
        </span>
      </div>
    </div>
  );
}
