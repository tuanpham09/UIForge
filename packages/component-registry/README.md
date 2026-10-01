# Component Registry

The component registry is framework-neutral semantic vocabulary. Code mappings are a separate, framework-aware layer.

## Code mapping

uiforge.code-mapping/v1 maps semantic component IDs to reviewed implementation metadata:

- framework/runtime/styling/library target
- import path and export name
- semantic prop and variant mapping
- design-token mapping
- dependencies and implementation version range
- upstream source location
- confidence and provenance

The canonical registry stores upstream project-relative component paths such as components/ui/button, not consumer-specific aliases such as @/components/ui/button. A consuming project resolves its alias separately.

### Query

Use resolveCodeMapping(componentId, target) for deterministic lookup. A missing mapping is returned explicitly rather than falling back to a visually similar component.

### Initial verified target

The first verified target is React + Next.js + Tailwind v4 + shadcn/ui for Button, Card, and Input. The mappings are based on the official shadcn/ui component documentation and are intentionally versioned/provenanced.
