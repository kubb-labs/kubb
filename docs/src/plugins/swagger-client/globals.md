---
layout: doc

title: Globals.d.ts
outline: deep
---

# Globals.d.ts

::: warning
 Under construction
:::

## Features

- `AXIOS_BASE` for Axios's `baseURL`
- `AXIOS_HEADERS` for Axios's `headers`

See [reference/fileManager#getenveource](/reference/fileManager#getenveource) for more information about how this works in the background.

::: code-group

```typescript [packages/swagger-client/src/types.ts]
export type Environments = {
  AXIOS_BASE?: CreateAxiosDefaults['baseURL']
  AXIOS_HEADERS?: CreateAxiosDefaults['headers']
}
```
:::

::: code-group

```typescript [packages/swagger-client/globals.d.ts]
type Environments = import('./src/types.ts').Environments

declare namespace NodeJS {
  export interface ProcessEnv extends Partial<Record<keyof Environments, string>> {}
}
```

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

```typescript [packages/core/src/managers/fileManager/types.ts]
export type File = {
  /**
   * Name to be used to dynamicly create the fileName(based on input.path)
   */
  fileName: string
  /**
   * Path will be full qualified path to a specified file
   */
  path: string
  source: string
  imports?: Import[]
  exports?: Export[]
  /**
   * This will call fileManager.add instead of fileManager.addOrAppend, adding the source when the files already exists
   * @default `false`
   */
  override?: boolean
  meta?: {
    pluginName?: string
  }
  /**
   * This will override `process.env[key]` inside the `source`, see `getFileSource`.
   */
  env?: NodeJS.ProcessEnv
}
```
:::

## Notes

This feature could be useful for:

- Types support for 'axios' options
- Prototyping

## Links
- [reference#getenveource](/reference#getenveource)