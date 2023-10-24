---
layout: doc

title: Globals.d.ts
outline: deep
---

# Globals.d.ts

## Features

Every plugin of `Kubb` has options and with the global `Kubb` you can access those options with `KubbJSONPlugins`.

See [packages/core/src/globals.d.ts](https://github.com/kubb-project/kubb/blob/main/packages/core/global.d.ts)

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
export type SwaggerPluginOptions = Kubb.OptionsOfPlugin<'@kubb/swagger'>
// ^? SwaggerPluginOptions = { validate? boolean | undefined; output?: string | false | undefined...}
```

```typescript [Kubb.Plugins name]
export type SwaggerName = Kubb.Plugins['@kubb/swagger']['name']
// ^? "swagger"
```

```typescript [Kubb.Plugins options]
export type SwaggerPluginOptions = Kubb.Plugins['@kubb/swagger']['options']
// ^? SwaggerPluginOptions = { validate? boolean | undefined; output?: string | false | undefined...}
```

```typescript [Kubb.OptionsPlugins]
export type SwaggerPluginOptions = Kubb.OptionsPlugins['@kubb/swagger']['options']
// ^? SwaggerPluginOptions = { validate? boolean | undefined; output?: string | false | undefined...}
```

:::

## Notes

This feature could be useful for:

- Types support for 'kubb' options
- Prototyping
