# UIForge Risk Register

| ID | Risk | Severity | Trigger | Mitigation | Exit Criteria |
|---|---|---:|---|---|---|
| R01 | Schema becomes tied to tldraw | High | domain imports tldraw types | adapter boundary + domain fixtures | schema package builds without editor |
| R02 | AI emits invalid structure | High | malformed/unknown nodes | structured output + validator + normalization | 100% fixture validation |
| R03 | AI design drift | High | arbitrary values accumulate | token/component validator | zero unapproved token violations in canonical fixture |
| R04 | MCP context too large | High | large screen response | scoped tools/resources + summaries | benchmark context stays under budget |
| R05 | MCP mutation unsafe | Critical | unauthorized write | auth + capability + audit + validation | negative security tests pass |
| R06 | Visual regression flakiness | High | screenshot changes across CI | pinned browser/font/runtime | stable repeat runs |
| R07 | Codegen duplicates components | High | generated Button/Card copies | code mapping registry | generated fixtures reuse mapped components |
| R08 | Provider lock-in | Medium | provider SDK in domain | AIProvider interface | domain package has no provider imports |
| R09 | Schema breaking change | High | old document fails | version + migration + fixtures | old fixture migrates successfully |
| R10 | Multi-tenant data leak | Critical | cross-project access | RLS + server auth + tests | unauthorized matrix returns deny |
| R11 | Editor performance degradation | High | large document interaction slows | normalized state + benchmarks | target interaction latency met |
| R12 | AI cost explosion | High | repeated generations | caching + quotas + model routing | cost per generation tracked |
| R13 | Asset/privacy leak | High | private asset exposed to MCP | signed URLs + auth | unauthorized asset request denied |
| R14 | Browser mismatch | Medium | target code differs from preview | same tokens/fixtures + visual QA | mismatch classified and bounded |
| R15 | MCP client compatibility | Medium | client cannot connect | official SDK + transport tests | Cursor/Claude/Codex smoke matrix passes |
| R16 | Overbuilding editor | High | features delayed by Figma parity | MVP scope guard | only roadmap capabilities accepted |
| R17 | Documentation drift | Medium | docs disagree with code | docs in PR checklist + contract tests | docs review gate passes |
| R18 | Vendor outage/API change | Medium | provider unavailable | provider abstraction + fallback policy | core fixtures run without live provider |
| R19 | Flow graph diverges from screen design | High | navigation represented only in prototype/canvas | canonical Experience Graph + validation + graph-aware MCP | all canonical journeys validate and round-trip |
| R20 | Agent implements visuals but misses behavior | High | screenshot passes while navigation is wrong | flow-aware MCP + interaction QA + benchmark | benchmark verifies screen and transition fidelity |
| R21 | Flow model over-engineered | Medium | too many prototype concepts enter domain | narrow semantic actions/triggers + explicit non-goals | P1 supports core product journeys without canvas coupling |
| R22 | Skill registry over-constrains creativity | High | generic skill rules block legitimate product-specific solutions | curated skills + explicit exceptions + provenance + strategy review | representative fixtures improve consistency without blocking valid patterns |
| R23 | Skill selection becomes opaque or arbitrary | High | model/provider hides why a pattern was chosen | deterministic discovery metadata + composition rules + fixture tests | every selected skill has inspectable match/provenance data |

## Incident rule

For Critical risks, implementation must stop when the risk is actively triggered until a mitigation or explicit exception is documented.

## Risk review cadence

Review risks:

- before each phase;
- after architecture changes;
- after security incidents;
- before public beta;
- before enabling write-capable remote MCP.
