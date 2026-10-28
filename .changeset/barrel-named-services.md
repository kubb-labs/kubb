---
'@kubb/plugin-barrel': minor
---

Add named service namespace exports alongside standalone operation functions with `output.barrel.namespace`.

- Enable nested barrels and export each immediate subdirectory under its PascalCase name.
- Forward service namespaces through an enabled root barrel.
- Keep standalone fetch functions available for React Query hooks and options.

```ts
pluginFetch({
  output: { path: 'client', barrel: { type: 'named', namespace: true } },
  group: { type: 'tag', name: ({ group }) => `${group}Service` },
})
```

Import the generated service with `import { PetService } from './gen/client'` and call `PetService.getPet(...)`.
