---
'@kubb/adapter-oas': patch
'@kubb/parser-md': patch
'@kubb/renderer-jsx': patch
---

Replace the `yaml` package with `@visulima/yaml`.

`@kubb/parser-md` and the `Frontmatter` component of `@kubb/renderer-jsx` write frontmatter with `@visulima/yaml`. A string longer than 80 characters is now written as a folded block (`>-`) instead of a plain scalar that continues on the next line. The value read back is the same.

`@kubb/adapter-oas` reports a YAML syntax error with the message from `@visulima/yaml`, which still names the line and column.
