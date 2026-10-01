# @uiforge/experience-graph

Canonical semantic model for product flows in UIForge.

UI Schema remains canonical for screen/node structure. Experience Graph is canonical for product behavior. Editor/canvas records are projections, never the persistence model.

## Contract
Version: uiforge.experience-graph/v1

The graph models flows, user journeys, starting points, transitions, triggers, actions, conditions and vendor-neutral animation metadata.

## Determinism and validation
Use serializeExperienceGraph for canonical serialization and validateExperienceGraph before persistence or accepting AI-generated flow changes. Validation reports missing destinations, invalid sources, duplicate/conflicting transitions, orphan/unreachable screens, missing starting points and dead ends.

## Replay
replayTransitions deterministically replays semantic triggers from a starting point. It does not execute UI code or infer behavior from coordinates.

## Versioning
Unsupported versions are rejected by migrateExperienceGraph. Future schema changes must add an explicit migration rather than silently coercing data.

## Dependencies
No runtime dependency on React, tldraw or AI/provider SDKs.
