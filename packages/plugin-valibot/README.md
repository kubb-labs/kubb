# @kubb/plugin-valibot

With the Valibot plugin you can use [Valibot](https://valibot.dev/) to validate your schemas based on an OpenAPI specification.

> [!WARNING]
> This plugin is in beta. Please report any issues you encounter.

## Installation

```bash
bun add -d @kubb/plugin-valibot
pnpm add -D @kubb/plugin-valibot
npm install --save-dev @kubb/plugin-valibot
yarn add -D @kubb/plugin-valibot
```

## Usage

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginValibot } from '@kubb/plugin-valibot'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginValibot({
      output: {
        path: './valibot',
      },
    }),
  ],
})
```

## Options

See [documentation](https://www.kubb.dev/plugins/plugin-valibot) for more details.
