# @uiforge/ai

Provider-independent AI orchestration for UIForge.

Pipeline:
Product Intent → Skill Discovery → Skill Composition → Design Strategy → Model → Parse → Validate → Normalize → Design-System Validate → Command/Patch

No provider SDK is imported. Provider adapters implement AIProvider. Design Intelligence owns semantic skill and strategy selection.

Contracts include structured generation, patch proposal, screenshot analysis, explicit prompt versions, model/usage metadata, bounded retries/timeouts, deterministic mock execution, and an SDK-free HTTP adapter for live provider gateways.

Raw provider output is never exposed as editor commands without schema validation.
