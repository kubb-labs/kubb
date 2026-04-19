---
'@kubb/core': minor
---

Add `@kubb/core/mocks` subpath export for testing utilities.

New exports:

- `createMockedPluginDriver(options)` — create a minimal PluginDriver mock
- `createMockedAdapter(options)` — create a minimal Adapter mock
- `createMockedPlugin(params)` — create a minimal Plugin mock
- `renderGeneratorSchema(generator, node, opts)` — render a generator's schema method
- `renderGeneratorOperation(generator, node, opts)` — render a generator's operation method
- `renderGeneratorOperations(generator, nodes, opts)` — render a generator's operations method

```ts
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorSchema } from '@kubb/core/mocks'
```
