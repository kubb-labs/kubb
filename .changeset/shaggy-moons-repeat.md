---
'@kubb/studio': minor
---

Let Studio change plugin options in a project's `kubb.config.ts`.

A new `save` command carries a list of edits, each one a `set`, `remove`, or `add-plugin`
`operation`. The agent patches the file's AST rather than regenerating it, so only the values an
edit names get rewritten. Comments, formatting, and the code you wrote around the config keep their
own text.

The agent writes nothing unless the host granted `allowConfigEdit`. That permission is separate
from `allowWrite`, which covers generated output. This one changes a file you wrote by hand, so it
is granted on its own and never in a sandbox.

The `connected` payload gains `configFile`, which lists every plugin call in the file and flags
each option as a literal or not. Options holding a function or a reference come back
`literal: false`, and the agent refuses to overwrite them, so Studio can disable those controls
instead of hiding them. A config the patcher cannot address, for instance a default export that
isn't a `defineConfig(...)` call, comes back `managed: false` and says why.
