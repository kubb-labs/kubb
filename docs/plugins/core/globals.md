---
layout: doc

title: Globals.d.ts
outline: deep
---

# Globals.d.ts

## Features

Every plugin of `Kubb` has options and with the global `Kubb`, you can access those options with `Kubb.Plugins`.

See [packages/core/src/globals.d.ts](https://github.com/kubb-labs/kubb/blob/main/packages/core/globals.d.ts)

::: code-group

<<< @/../packages/core/globals.d.ts

:::

### TypeScript

To get TypeScript support for Kubb, add `@kubb/core/globals` to your tsconfig.json:

::: code-group

```json [tsconfig.json]
{
  "compilerOptions": {
    "types": [
      "@kubb/core/globals" // [!code ++]
    ]
  }
}
```

:::

### Usage
::: code-group

```typescript [Kubb.OptionsOfPlugin]
import { Kubb } from '@kubb/core'
export type SwaggerPluginOptions = Kubb.OptionsOfPlugin<'@kubb/plugin-oas'>
// ^? SwaggerPluginOptions = { validate? boolean | undefined; output?: string | false | undefined...}
```

```typescript [Kubb.Plugins name]
import { Kubb } from '@kubb/core'
export type SwaggerName = Kubb.Plugins['@kubb/plugin-oas']['name']
// ^? "swagger"
```

```typescript [Kubb.Plugins options]
import { Kubb } from '@kubb/core'
export type SwaggerPluginOptions = Kubb.Plugins['@kubb/plugin-oas']['options']
// ^? SwaggerPluginOptions = { validate? boolean | undefined; output?: string | false | undefined...}
```

```typescript [Kubb.OptionsPlugins]
import { Kubb } from '@kubb/core'
export type SwaggerPluginOptions = Kubb.OptionsPlugins['@kubb/plugin-oas']['options']
// ^? SwaggerPluginOptions = { validate? boolean | undefined; output?: string | false | undefined...}
```

:::

## Notes

This feature could be useful for:

- Types support for `Kubb` options
- Prototyping
