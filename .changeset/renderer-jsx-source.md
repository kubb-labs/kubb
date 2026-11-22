---
'@kubb/renderer-jsx': patch
---

Add `Code`, `Raw` and `Inline`, for the source blocks that `Const`, `Type` and `Function` cannot express. `File.Source` is deprecated in their favor.

- `Code` is a printed declaration: `name`, `export`, `type`, `pointer`, and `index` to leave it out of barrels.
- `Raw` is text that declares nothing, such as `faker.seed(1)`, JSON or markdown. Its optional `name` only dedupes it.
- `Inline` is a printed declaration that importing files absorb, with `name` and `expression`.

```diff
- <File.Source name="Pet" isExportable isIndexable isTypeOnly>{printed}</File.Source>
+ <Code name="Pet" export type>{printed}</Code>
```
