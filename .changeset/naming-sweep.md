---
'@kubb/core': minor
'@kubb/ast': minor
'@kubb/kit': minor
'@kubb/renderer-jsx': minor
'unplugin-kubb': minor
'kubb': minor
---

Rename public types and classes to shorter names. The old names still work and are deprecated until v6.

| Package | Deprecated | Use instead |
| --- | --- | --- |
| `@kubb/core`, `kubb` | `CreateKubbOptions` | `KubbOptions` |
| `@kubb/core` | `KubbDriver` | `Driver` |
| `@kubb/core`, `@kubb/kit` | `Exclude`, `Include` | `Filter` |
| `@kubb/kit` | `GeneratorContext` | `TemplateContext` |
| `@kubb/renderer-jsx` | `JSDoc` | `JSDocNode` from `@kubb/ast` |
| `unplugin-kubb` | `Options` | `UnpluginKubbOptions` |

`KubbDriver` is the same class as `Driver`, so `instanceof KubbDriver` keeps working.

New exports:

- `@kubb/core` exports the `DiagnosticError` class and the `AdapterParseOptions`, `AdapterValidateOptions`, `SourceRange`, `LockfileOptions` and `FileChanges` types.
- `@kubb/ast` exports the `CreateSchemaInput` type.
- `@kubb/kit` exports the `Filter` type.
- `@kubb/renderer-jsx` exports the `JsxRenderer` type.
