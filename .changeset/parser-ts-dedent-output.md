---
"@kubb/parser-ts": minor
---

Normalize the indentation of generated declarations so the output reads cleanly before any formatter runs. Raw text and JSX nodes are now dedented to a column-zero baseline when printed, which removes the source indentation that template literals bake into multi-line `const`, `type`, `function`, and arrow-function bodies and stops it from compounding under the structural indent. Top-level declarations in a source are separated by a blank line, and an explicit `<br/>` no longer doubles that gap. A `dedent` helper sits next to `indentLines` for this.
