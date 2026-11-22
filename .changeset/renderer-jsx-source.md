---
'@kubb/renderer-jsx': patch
---

Add `Code` and `Raw`, for the source blocks that `Const`, `Type` and `Function` cannot express. `File.Source` is deprecated in their favor.

- `Code` is a printed declaration, with `name`, `export`, `type` and `pointer`. `export` lists it in barrels.
- `Raw` is text that declares nothing, such as `faker.seed(1)`, JSON or markdown. Its optional `name` only dedupes it.

```diff
- <File.Source name="Pet" isExportable isIndexable isTypeOnly>{printed}</File.Source>
+ <Code name="Pet" export type>{printed}</Code>
```
