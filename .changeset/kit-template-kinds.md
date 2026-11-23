---
'@kubb/kit': patch
---

Export `templateKinds`, the template kinds as a constant: `templateKinds.schema`, `templateKinds.operation` and `templateKinds.operations`. `defineTemplate({ kind: templateKinds.schema, … })` types `render` the same as `kind: 'Schema'`. `TemplateKind` is now derived from it.
