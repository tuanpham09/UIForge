"use client";

import { defaultTokenSet } from "@uiforge/design-tokens";
import { getViewport, renderScreen } from "@uiforge/renderer";
import type { UIDocument } from "@uiforge/ui-schema";
import { useMemo, useState } from "react";

export default function RendererPreview({
  document,
  screenId,
  initialPreset = "wide",
}: {
  document: UIDocument;
  screenId: string;
  initialPreset?: "wide" | "desktop" | "tablet" | "mobile";
}) {
  const [preset, setPreset] = useState<
    "wide" | "desktop" | "tablet" | "mobile"
  >(initialPreset);
  const viewport = useMemo(() => getViewport(preset), [preset]);
  const result = useMemo(
    () =>
      renderScreen(document, screenId, defaultTokenSet, {
        viewport,
      }),
    [document, screenId, viewport],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-white text-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          {(["wide", "desktop", "tablet", "mobile"] as const).map((item) => (
            <button
              className={`rounded-md border px-3 py-1.5 text-sm ${preset === item ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
              data-testid={`viewport-${item}`}
              key={item}
              type="button"
              onClick={() => setPreset(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span
          className="ml-auto text-xs text-slate-500"
          data-testid="renderer-viewport"
        >
          {viewport.width}×{viewport.height}
        </span>
      </div>
      <div
        className="mx-auto min-h-48 overflow-auto bg-white p-6"
        data-testid="renderer-preview"
        data-screen-id={screenId}
        data-viewport={preset}
        style={{ maxWidth: viewport.width }}
      >
        {result.element}
      </div>
      <aside
        aria-label="Preview diagnostics"
        className="border-t border-slate-200 bg-slate-50 p-3"
        data-testid="renderer-diagnostics"
      >
        {result.diagnostics.length === 0 ? (
          <span className="text-xs text-emerald-700">
            No renderer diagnostics
          </span>
        ) : (
          result.diagnostics.map((diagnostic) => (
            <div
              className="text-xs text-amber-700"
              key={[
                diagnostic.code,
                diagnostic.nodeId ?? "document",
                diagnostic.message,
              ].join("-")}
            >
              {diagnostic.message}
            </div>
          ))
        )}
      </aside>
    </div>
  );
}
