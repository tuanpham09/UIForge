# @uiforge/component-registry

Framework-neutral semantic vocabulary shared by AI, editor, renderer, MCP and codegen.

Every definition contains a stable ID, anatomy, variants, states, semantic tokens, accessibility contract, contextual decision metadata, responsive behavior, Experience Graph implications, renderer binding and a project-specific code-mapping placeholder.

The registry is independent of React, tldraw and repository-specific imports. Agents should consult it before selecting a component; project mappings are resolved later.

Renderer bindings identify a semantic implementation slot. They do not make the registry itself framework-specific.
