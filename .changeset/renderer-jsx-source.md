---
'@kubb/renderer-jsx': patch
---

Add `Code` and `Raw`, for the source blocks that `Const`, `Type` and `Function` cannot express. `File.Source` is deprecated in their favor.

- `Code` is a printed declaration, with `name`, `export`, `default` and `type`. `export` lists it in barrels.
- `Origin` sets the input location of the sources inside it, for code that comes from a different part of the input than the node being generated.
- `Raw` is text that declares nothing, such as `faker.seed(1)`, JSON or markdown. Its optional `name` only dedupes it.

```diff
- <File.Source name="Pet" isExportable isIndexable isTypeOnly>{printed}</File.Source>
+ <Code name="Pet" export type>{printed}</Code>
```

The `kubb-source` host element is replaced by `kubb-code` for `Code` and `File.Source`, and `kubb-raw` for `Raw` and the markdown components. `kubb-origin` carries the pointer that `Origin` and `File.Source` set.
