---
'@kubb/studio': patch
---

`ManagedPlugin.options` now carries each writable option's actual value, read straight off the
`kubb.config.ts` AST, not just whether it's a literal. Studio had nothing to show for a
`defineConfig(...)` entry it doesn't generate from, since only the entry Studio runs sent real
option values before this.
