---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Capture the OpenAPI parameter `style` and `explode` on the AST.

`ParameterNode` gains optional `style` (`'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'`) and `explode` fields, and the OpenAPI adapter now reads them from each parameter object. Both stay `undefined` when the spec omits them, so consumers keep applying the per-location default. This lets client generators emit per-parameter serialization metadata for full `label` / `matrix` path-parameter support.
