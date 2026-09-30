"use client";

import { Tldraw, toRichText } from "tldraw";
import "tldraw/tldraw.css";
import { useMemo } from "react";
import { dashboardFixture } from "@uiforge/ui-schema";
import { projectDocument } from "@uiforge/editor";

export default function EditorCanvas() {
  const projection = useMemo(() => projectDocument(dashboardFixture), []);
  return (
    <div className="h-[720px] w-full overflow-hidden rounded-xl border border-slate-700">
      <Tldraw
        onMount={(editor) => {
          if (editor.getCurrentPageShapeIds().size > 0) return;
          editor.createShapes(
            projection.shapes.map((shape) => ({
              id: shape.id,
              type: shape.type,
              x: shape.x,
              y: shape.y,
              props: {
                w: shape.props.w,
                h: shape.props.h,
                geo: shape.props.geo,
                richText: toRichText(
                  dashboardFixture.nodes[shape.meta.nodeId]?.content?.label ??
                    dashboardFixture.nodes[shape.meta.nodeId]?.type ??
                    "UIForge",
                ),
              },
              meta: shape.meta,
            })),
          );
          editor.zoomToFit({ animation: { duration: 0 } });
        }}
      />
    </div>
  );
}
