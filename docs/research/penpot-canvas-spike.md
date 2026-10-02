# Penpot Canvas Spike

> Issue #62 — decision spike for the UIForge canvas architecture.

## Research snapshot

Penpot's current frontend architecture separates the workspace UI from reusable/common geometry and delegates expensive selection/snapping indexes to a Web Worker. The common geometry layer exposes points, matrices, and shape/bounds operations. The workspace also has a WebGL renderer, currently documented as beta.

Primary source paths reviewed:

- `common/src/app/common/geom/` — geometry primitives and shape transforms/bounds.
- `frontend/src/app/main/ui/workspace/` — workspace/editor UI.
- `frontend/src/app/worker/snaps/` — snap-distance indexing.
- `frontend/src/app/worker/selection/` — geometric selection index / hit testing.
- `frontend/src/app/main/ui/workspace/viewport/` — viewport, rulers and overlays.
- `frontend/src/app/render_wasm/` and `render-wasm/` — current WebGL/WASM rendering path.
- `frontend/src/app/main/ui/workspace/shapes/` — shape-to-SVG UI rendering.
- `exporter/src/app/` — browser-based export path.

## Reuse / port / keep / remove

| Area | Penpot candidate | Decision | Rationale |
|---|---|---|---|
| Geometry | `common/.../geom` | PORT CONCEPTS / SPIKE | Strong candidate, but Clojure/ClojureScript integration into TS is a major boundary. |
| Transform | geometry matrices/shapes | PORT CONCEPTS | Keep UIForge schema canonical; port only algorithms proven necessary. |
| Selection / hit-test | `frontend/src/app/worker/selection` | PORT / REIMPLEMENT ADAPTER | Useful architecture; direct reuse is coupled to Penpot state/index structures. |
| Snapping | `frontend/src/app/worker/snaps` | PORT CONCEPTS | Valuable, but likely easier to adapt algorithmically than embed the worker module. |
| Viewport | workspace viewport | KEEP UIForge | UIForge needs React/TS-native viewport state and its own UX. |
| Shapes | Penpot shape components | KEEP UIForge | UIForge Schema should map to its own renderer. |
| SVG renderer | Penpot renderer/export path | STUDY / SELECTIVE REUSE | Useful reference for fidelity; direct integration needs deeper dependency analysis. |
| WebGL renderer | `render-wasm` | DEFER | Powerful but currently beta and introduces WASM/rendering complexity. |
| Guides / rulers | workspace viewport modules | PORT CONCEPTS | Useful later; not required for the first canvas decision. |
| Collaboration/backend | Penpot backend | REMOVE | Outside UIForge scope. |
| Penpot document model | Penpot file/state model | REMOVE | UIForge Schema remains source of truth. |
| tldraw | Current UIForge canvas | KEEP FOR NOW | Production stability while the spike validates alternatives. |

## Architecture decision for the spike

The spike intentionally uses an adapter boundary:

```
UIForge Schema
      |
      v
Canvas Adapter
      |
      +--> current tldraw projection
      |
      +--> future Penpot-derived engine
```

This avoids coupling the application to Penpot's backend, database, auth, collaboration, or document model.

## Spike outcome

The first implementation target is not a Penpot fork. It is a small, isolated TypeScript proof that demonstrates the boundary needed to replace/augment tldraw later.

Required capabilities:

- frame + rectangle + text projection
- selection rectangle
- pan/zoom state
- basic move/resize intent
- schema remains canonical

## Current recommendation

Do **not** replace tldraw yet.

The strongest candidates to borrow from Penpot are the geometry, selection-index, and snapping approaches. The WebGL renderer should be treated as a later performance experiment rather than a dependency for the initial UIForge canvas.

Direct source reuse should only happen after dependency/licensing analysis confirms that the selected Penpot module can be isolated cleanly.

## License note

Penpot source files carry MPL-2.0 licensing headers. Any direct source-code reuse/modification must be reviewed for MPL-2.0 compliance, including file-level licensing and distribution obligations. This spike therefore prefers documenting/porting algorithms over copying large Penpot subsystems until compliance is explicitly reviewed.

## Follow-up

If the spike succeeds, create a focused implementation issue for the selected canvas path. If it fails, keep tldraw and use the findings to improve the existing adapter/projection layer rather than introducing Penpot wholesale.

## Sources

- Penpot architecture: https://help.penpot.app/technical-guide/developer/architecture/
- Penpot frontend architecture: https://help.penpot.app/technical-guide/developer/architecture/frontend/
- Penpot common geometry: https://help.penpot.app/technical-guide/developer/architecture/common/
- Penpot WebGL renderer: https://help.penpot.app/user-guide/first-steps/troubleshooting-webgl/
- Penpot exporter: https://help.penpot.app/technical-guide/developer/architecture/exporter/
- Penpot source: https://github.com/penpot/penpot
