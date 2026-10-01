# @uiforge/responsive

Deterministic semantic responsive-rule engine for UIForge.

## Contract

- Version: `uiforge.responsive/v1`
- Canonical validation viewports: 1440×900, 1024×768, 768×1024, 390×844.
- Responsive rules are semantic projections over UI Schema.
- Missing rules do not invent transformations.
- Experience Graph remains the canonical owner of navigation semantics.

## Pipeline

`UI Schema → Responsive Rule Engine → viewport projection → Renderer / Code Specification`

The four presets are validation anchors, not an exhaustive list of supported browser widths.
