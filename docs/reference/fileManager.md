---
layout: doc

title: FileManager
outline: deep
---

# FileManager <Badge type="info" text="@kubb/core" />

::: warning
Under construction
:::

### getEnvSource

See [packages/core/src/managers/fileManager/utils.ts](https://github.com/kubb-project/kubb/blob/main/packages/core/src/managers/fileManager/utils.ts).

When using `client` in for examples the plugin `@kubb/swagger-client` the following things will happen:

- Read in `client.ts`
- Copy paste `client.ts` to the output folder of the `@kubb/swagger-client` plugin
- Replace process.env[NAME] by a correct env set in the type `File`

❕environments should always be UPPERCASED

#### Example with `process.env`

::: code-group

```typescript [input]
import path from 'node:path'

const file: File = {
  path: path.resolve('./src/models/file1.ts'),
  fileName: 'file1.ts',
  source: 'export const hello = process.env.HELLO;',
  imports: [
    {
      name: ['Pets'],
      path: './Pets',
      isTypeOnly: true,
    },
  ],
  env: {
    HELLO: `"world"`,
  },
}
```

```typescript [output]
import type { Pets } from './Pets'

export const hello = 'world'
```

:::

#### Example with globals

::: code-group

```typescript [input]
import path from 'node:path'

const file: File = {
  path: path.resolve('./src/models/file1.ts'),
  fileName: 'file1.ts',
  source: 'declare const HELLO: string; export const hello = typeof HELLO !== "undefined" ? HELLO : undefined',
  imports: [
    {
      name: ['Pets'],
      path: './Pets',
      isTypeOnly: true,
    },
  ],
  env: {
    HELLO: `"world"`,
  },
}
```

```typescript [output]
import type { Pets } from './Pets'

export const hello = typeof 'world' !== 'undefined' ? 'world' : undefined
```

:::
