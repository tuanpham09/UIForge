"use client";

import {
  buildLayerTree,
  filterLayers,
  type SemanticLayer,
} from "@uiforge/editor";
import {
  applyCommand,
  createFrameFromPreset,
  dashboardFixture,
  FRAME_PRESETS,
  type FrameId,
  type NodeId,
  type NodePatch,
  type UIDocument,
} from "@uiforge/ui-schema";
