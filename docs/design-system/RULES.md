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

## 7. Component decision rules

Components are not selected by visual preference alone. Each reusable component must expose semantic decision metadata:

- purpose;
- when-to-use;
- when-not-to-use;
- task/hierarchy fit;
- variants by context;
- states;
- accessibility requirements;
- responsive behavior;
- interaction semantics;
- composition/nesting rules;
- anti-patterns;
- alternatives;
- Experience Graph implications.

### Button

- Use a Button for an action or state mutation.
- Use a link when the semantic operation is navigation without state mutation.
- A primary Button represents the dominant action in a decision context.
- Secondary/tertiary variants are for supporting actions.
- Destructive styling is reserved for destructive actions.
- Loading state must communicate progress and prevent duplicate submission where appropriate.
- Icon-only actions require an accessible name and must be unambiguous.
- Button groups must preserve action hierarchy; do not create several visually equal primary actions without explicit product justification.

### Card

- Use Card to group related content or a meaningful summary/preview.
- Do not wrap every section in Card by default.
- Interactive Card requires explicit interaction semantics and must not conflict with contained controls.
- Do not nest multiple independent interactive targets inside an interactive Card without a defined interaction model.
- Elevation is structural only when it communicates grouping, layering or affordance; do not add shadows as decoration by default.

### Form / Input

- Every field has an accessible label/name and description/error relationship when applicable.
- Input type, keyboard behavior, required/optional state and validation behavior must be explicit.
- Validation state must remain semantic; color alone is insufficient.
- Submission/loading/error states are part of the interaction contract.

### Dialog / Sheet

- Use an overlay only when interruption or focused context is justified.
- Prefer inline flows when the task does not require interruption.
- Desktop Dialog and mobile Sheet are responsive presentations of the same semantic action when appropriate.
- Focus return/trapping and Escape/back behavior must be explicit.
- Destructive confirmation must use an explicit destructive action and semantic transition.

### Navigation

Navigation choice depends on information architecture, viewport, screen count and task frequency.

- bottom navigation: primary destinations in compact mobile experiences;
- sidebar/navigation rail: persistent multi-destination navigation on larger surfaces;
- tabs: peer views inside one information context, not unrelated top-level destinations;
- breadcrumbs: hierarchical location context, not primary navigation;
- back: history/context return, not a replacement for explicit destination semantics.

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

## 9. Layout

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

## 10. Responsive design

Every screen must declare:

- supported viewports;
- breakpoint behavior;
- stacking/reflow rules;
- visibility changes;
- navigation changes;
- typography changes where applicable.

Do not simply scale desktop pixels down.

## 11. Interaction and flow consistency

Every interactive element that changes product state or navigation must map to a semantic transition.

Rules:

- every navigation action has an explicit destination;
- every flow has an explicit starting point;
- broken destinations are validation errors;
- orphan/unreachable screens are surfaced rather than silently ignored;
- loading, success and error branches are modeled where they affect user behavior;
- overlays, back actions and state changes are distinguished from full navigation;
- prototype animation metadata must not redefine the semantic action.

## 12. Accessibility

Interactive elements require:

- accessible name;
- keyboard path;
- focus-visible state;
- appropriate semantic role;
- sufficient contrast;
- error/status communication where relevant.

Generated code must preserve these semantics.

## 13. Density

Do not solve visual quality by adding decoration.

Prioritize:

1. hierarchy;
2. spacing;
3. typography;
4. alignment;
5. contrast;
6. interaction states;
7. decoration.

## 14. Design skill constraints

AI may compose from approved Design Skills. A skill may contribute:

- domain-specific UX patterns;
- information architecture patterns;
- component/layout patterns;
- interaction patterns;
- responsive rules;
- accessibility constraints;
- anti-patterns.

Skill composition must be deterministic for the same Product Intent + registry version and must preserve provenance for the selected skills.

## 15. AI design constraints

AI may choose from:

- existing components;
- approved variants;
- existing tokens;
- documented layout primitives.

If AI proposes a new token/component, it must explain why an existing primitive cannot satisfy the requirement. The Design Strategy should preserve selected-skill provenance so downstream generation can explain major design decisions without depending on an opaque model prompt.

## 16. Visual quality gate

Every new component should have:

- canonical fixture;
- desktop screenshot;
- mobile screenshot if responsive;
- interaction state screenshots where important.

Visual baselines are reviewed as code changes.

## 17. Code consistency

The generated implementation must use the same semantic token names and component IDs whenever the target framework supports them.

## 18. No silent drift

If implementation intentionally differs from design, record:

- reason;
- affected node/component;
- expected difference;
- owner;
- follow-up issue if temporary.

