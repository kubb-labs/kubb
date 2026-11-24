---
'@kubb/kit': patch
'@kubb/core': patch
'@kubb/parser-ts': patch
---

Fix the operation file suffix for plugins whose groups differ only by `group.name`, and give every deprecation the same removal target.

- `@kubb/kit`: an operation file checks the schema files of its own `output` and `group`, so a `group.name` that differs from an earlier call no longer reuses that call's schema paths.
- `@kubb/core`: every `@deprecated` note now says "Removed in Kubb v6." The [deprecations page](https://kubb.dev/docs/5.x/reference/deprecations) lists them with their replacements.
- `@kubb/parser-ts`: the `TsNode` deprecation now says "Removed in Kubb v6."
