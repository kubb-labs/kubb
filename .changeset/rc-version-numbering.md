---
"unplugin-kubb": patch
---

Move `unplugin-kubb` past its squatted npm version range.

Versions 5.0.1 through 5.0.30 were already published on npm from `unplugin-kubb`'s
pre-monorepo history and depend on kubb v4, so the package's version was set directly to
5.0.31 to clear that range. This changeset picks up from that 5.0.31 baseline and puts
`unplugin-kubb` back through the normal release process, independent of `kubb` and `@kubb/*`.
