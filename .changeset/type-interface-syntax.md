---
'@kubb/ast': patch
'@kubb/parser-ts': patch
'@kubb/renderer-jsx': patch
---

`Type` and `TypeNode` take `syntax: 'interface'`, which prints `interface Name { … }` in place of `type Name = …`.

```tsx
<Type export name="Pet" syntax="interface">{'{ id: number }'}</Type>
// export interface Pet { id: number }
```
