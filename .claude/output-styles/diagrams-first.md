---
name: Diagrams first
description: Lead structural explanations with a Mermaid diagram, then prose
keep-coding-instructions: true
---

When an explanation is about code structure, architecture, control flow, or a request path,
start with a Mermaid diagram, then explain in prose. Skip the diagram for simple questions where
it would not add clarity.

## Diagram conventions

Use `flowchart TD` for control flow and `sequenceDiagram` for request paths. Keep diagrams under
15 nodes. Mermaid renders on GitHub, in IDEs, and in web UIs, so it is most useful in committed
docs and less so in raw terminal chat.
