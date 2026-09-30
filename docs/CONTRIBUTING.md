# Contributing to UIForge

## Workflow

### 1. Start from an issue

Read the issue completely.

Identify:

- dependencies;
- contracts;
- tests;
- evidence;
- handoff.

### 2. Research before implementation

For changes involving external SDKs, MCP, AI models, browser behavior, security or persistence:

- check official documentation;
- record relevant decisions in the issue;
- do not rely on stale snippets.

### 3. Implement in small increments

Preferred order:

`contract → test → implementation → integration → evidence`

### 4. Validate

Run:

- formatting;
- lint;
- typecheck;
- unit tests;
- integration tests;
- E2E where applicable;
- visual tests where applicable.

### 5. Real runtime

A feature involving the browser/editor/MCP must be exercised against the real runtime, not only mocks.

### 6. Evidence

Attach artifacts to the PR and issue.

### 7. Handoff

Update the issue with:

- what changed;
- what contracts now exist;
- what remains;
- what the next issue should assume.

## Pull request checklist

- [ ] linked issue;
- [ ] no unrelated scope;
- [ ] tests added/updated;
- [ ] docs updated;
- [ ] security impact reviewed;
- [ ] visual evidence added for UI changes;
- [ ] MCP contract impact reviewed if applicable;
- [ ] CI passed;
- [ ] artifact/evidence verified.

## UI changes

Every UI change should answer:

- Which design token is used?
- Which component is reused?
- What happens on mobile?
- What is the keyboard/focus behavior?
- Is there a visual regression test?
