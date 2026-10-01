# @uiforge/component-intelligence

Deterministic semantic component decision layer for UIForge.

## Pipeline

`Context → Discover Skills → Select Pattern → Select Component → Select Variant → Apply Tokens → Define States → Define Interaction → Define Responsive Rules → Validate → Record Decision → Patch`

This package consumes the semantic component registry and emits a typed decision plus concise provenance. It does not render UI or call an AI provider.

### Decision Records

Decision Records contain only inspectable provenance: selected component/variant/state, triggering context, rule/skill IDs, concise rationale and validation findings. They are **not chain-of-thought storage** and never persist private model reasoning.

### Specialists

The orchestrator uses scoped specialist contracts. Reviewers are read-only. Mutation is intentionally outside this package and must be performed by a higher-level typed command layer after validation.

### Skill loading

Discovery returns lightweight metadata references. Detailed skill metadata is loaded only after discovery through `SkillLoader.load`, keeping prompts free from unrelated skill content.

### Rule precedence

Rules carry explicit priority and rule kind. Matching is sorted by priority and stable rule ID; forbidden outcomes are rejected before a decision can be applied.

### Boundaries

No React, tldraw, Next.js or AI provider dependency. The only runtime dependency is the framework-neutral component registry.
