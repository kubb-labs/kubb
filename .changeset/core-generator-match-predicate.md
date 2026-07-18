---
'@kubb/core': minor
---

Add an optional `match` predicate to `Generator` (`defineGenerator`). Return `false` from `match(node, ctx)` to skip a generator's `schema`/`operation` call for a given node entirely, with no context work beyond what the driver already builds per node and no render call, instead of the generator being invoked and returning early. Omit it to run for every node, the existing default behavior — this is purely additive.

This lets a generator declare its own scope declaratively instead of always running. A plugin that registers several generators for the same node type (for example one hook generator per query variant) can now let each one opt in with `match` rather than hand-rolling a dispatcher that classifies the node once and manually renders the matching generator's output.
