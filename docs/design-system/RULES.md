# UIForge Design System Rules

These rules govern both the UIForge application UI and generated design documents.

## 1. Source of truth

Design tokens and registered components are canonical.

Do not create parallel styling systems.

## 2. Token hierarchy

Use semantic tokens:

```
color.background
color.surface
color.surfaceMuted
color.foreground
color.mutedForeground
color.primary
color.primaryForeground
color.destructive
color.border

space.1 ... space.12

radius.sm
radius.md
radius.lg
radius.full

shadow.sm
shadow.md
shadow.lg

type.body
type.label
type.title
type.display
```

Raw values are allowed only for:

- imported assets;
- third-party constraints;
- deliberate exceptions documented in the node metadata.

## 3. Spacing

Use a predictable scale. Prefer tokens over one-off values.

Bad:

`padding: 13px`

Good:

`padding: token(space.4)`

unless 13px is explicitly required by an imported design and marked as an exception.

## 4. Typography

Typography must define:

- family;
- size;
- weight;
- line height;
- letter spacing where relevant.

Do not infer line height from browser defaults.

## 5. Color

Semantic color is preferred over literal hex.

Bad:

`#6366F1`

Good:

`color.primary`

The token may resolve to `#6366F1`, but the design intent remains semantic.

## 6. Components

Every reusable component has:

- semantic name;
- purpose;
- variants;
- states;
- anatomy;
- token usage;
- accessibility contract;
- code mapping.

Examples:

`Button`, `Input`, `Card`, `Dialog`, `Table`, `Tabs`, `Navigation`.

Avoid names based on appearance such as `BlueRoundedBox`.

## 7. States

Interactive components should define where relevant:

- default;
- hover;
- focus-visible;
- active;
- disabled;
- loading;
- error;
- selected.

## 8. Layout

Prefer semantic constraints:

- stack;
- row;
- grid;
- fill;
- hug;
- min/max;
- alignment;
- gap.

Avoid using absolute coordinates as the primary semantic representation.

## 9. Responsive design

Every screen must declare:

- supported viewports;
- breakpoint behavior;
- stacking/reflow rules;
- visibility changes;
- navigation changes;
- typography changes where applicable.

Do not simply scale desktop pixels down.

## 10. Accessibility

Interactive elements require:

- accessible name;
- keyboard path;
- focus-visible state;
- appropriate semantic role;
- sufficient contrast;
- error/status communication where relevant.

Generated code must preserve these semantics.

## 11. Density

Do not solve visual quality by adding decoration.

Prioritize:

1. hierarchy;
2. spacing;
3. typography;
4. alignment;
5. contrast;
6. interaction states;
7. decoration.

## 12. AI design constraints

AI may choose from:

- existing components;
- approved variants;
- existing tokens;
- documented layout primitives.

If AI proposes a new token/component, it must explain why an existing primitive cannot satisfy the requirement.

## 13. Visual quality gate

Every new component should have:

- canonical fixture;
- desktop screenshot;
- mobile screenshot if responsive;
- interaction state screenshots where important.

Visual baselines are reviewed as code changes.

## 14. Code consistency

The generated implementation must use the same semantic token names and component IDs whenever the target framework supports them.

## 15. No silent drift

If implementation intentionally differs from design, record:

- reason;
- affected node/component;
- expected difference;
- owner;
- follow-up issue if temporary.

