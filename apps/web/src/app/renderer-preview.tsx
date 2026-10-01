"use client";

import { defaultTokenSet } from "@uiforge/design-tokens";
import { getViewport, renderScreen } from "@uiforge/renderer";
import { dashboardFixture } from "@uiforge/ui-schema";
import { useMemo, useState } from "react";

const screens = dashboardFixture.screens;

export default function RendererPreview() {
  const [screenId, setScreenId] = useState(screens[0]?.id ?? "");
  const [preset, setPreset] = useState<"wide" | "desktop" | "tablet" | "mobile">("wide");
  const viewport = useMemo(() => getViewport(preset), [preset]);
  const result = useMemo(
    () =>
      renderScreen(dashboardFixture, screenId, defaultTokenSet, {
        viewport,
      }),
    [screenId, viewport],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-white text-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
        {screens.map((screen) => (
          <button
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            key={screen.id}
            onClick={() => setScreenId(screen.id)}
            type="button"
          >
            {screen.name}
          </button>
        ))}
        {(["wide", "desktop", "tablet", "mobile"] as const).map((item) => (
          <button
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            data-testid={`viewport-${item}`}
            key={item}
            onClick={() => setPreset(item)}
            type="button"
          >
            {item}
          </button>
        ))}
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
