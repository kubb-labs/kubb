---
'@kubb/adapter-oas': minor
---

Group the server options and rename the discriminator modes.

## Breaking changes

### Server options

`serverIndex` and `serverVariables` are replaced by a single `server` object.

```ts
// Before
adapterOas({ serverIndex: 0, serverVariables: { env: 'prod' } })

// After
adapterOas({ server: { index: 0, variables: { env: 'prod' } } })
```

`resolveBaseUrl` now takes `{ document, server }` instead of `{ document, serverIndex, serverVariables }`.

### Discriminator modes

The `discriminator` values are renamed for clarity. `'strict'` becomes `'preserve'` and `'inherit'` becomes `'propagate'`. The default is now `'preserve'`.

```ts
// Before
adapterOas({ discriminator: 'inherit' })

// After
adapterOas({ discriminator: 'propagate' })
```
