---
layout: doc

title: Globals.d.ts
outline: deep
---

# Globals.d.ts <Badge type="warning" text="beta" />

## Features

- `AXIOS_BASE` for Axios's `baseURL`
- `AXIOS_HEADERS` for Axios's `headers`

See [reference/fileManager#getenveource](/reference/fileManager#getenveource) for more information about how this works in the background.

::: code-group
<<< @/../packages/swagger-client/src/types.ts{12-15}

<<< @/../packages/swagger-client/globals.d.ts{22-24}

:::

### TypeScript

To get TypeScript support for `NodeJS.ProcessEnv`(with already the `process.env` type being set), add `@kubb/swagger-client/globals` to your tsconfig.json:

::: code-group

```typescript [tsconfig.json]
{
  "compilerOptions": {
    "types": [
      "@kubb/swagger-client/globals" // [!code ++]
    ]
  }
}
```

:::

### Usage

::: code-group

<<< @/../packages/core/src/managers/fileManager/types.ts{38-69}

:::

## Notes

This feature could be useful for:

- Types support for 'axios' options
- Prototyping

## Links

- [reference#getenveource](/reference#getenveource)
