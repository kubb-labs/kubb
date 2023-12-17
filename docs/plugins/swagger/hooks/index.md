---
layout: doc

title: \@kubb/swagegr
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/swagger`.<br/>
See [Oas](https://github.com/readmeio/oas) to understand how to use the `Oas` instance or the `Oas` schemas.

## useOas

`useOas` will return the Oas instance.<br/>

::: code-group

```typescript
import { useOas } from '@kubb/react'

function Component() {
  const oas = useOas()

  return null
}
```

:::

## useOperation

`useOperation` will return the current `Operation`.<br/>

::: code-group

```typescript
import { useOperation } from '@kubb/react'

function Component() {
  const operation = useOperation()

  return null
}
```

:::

## useSchemas

`useSchemas` will return the schemas of the current `Operation`.<br/>

::: code-group

```typescript
import { useSchemas } from '@kubb/react'

function Component() {
  const schemas = useSchemas()

  return null
}
```

:::

## useOperationName

`useOperationName` will return the name based on the current operation and plugin(when `pluginKey` is not provided).<br/>

::: code-group

```typescript
import { useOperationName } from '@kubb/react'

function Component() {
  const name = useOperationName({
    type: 'type',
    pluginKey: ['custom-plugin'], // optional
  })

  return null
}
```

:::

## useOperationFile

`useOperationFile` will create all the props used for `<File/>` based on the current operation and plugin(when `pluginKey` is not provided)<br/>

::: tip
Internally `useFile` of `@kubb/react` is getting used.
:::

::: code-group

```typescript
import { File, useOperationFile } from '@kubb/react'

function Component() {
  const file = useOperationFile({
    pluginKey: ['custom-plugin'], // optional
  })

  return (
    <File
      baseName={file.baseName}
      path={file.path}
      meta={file.meta}
    >
      <File.Source>
        export const helloWorld = true;
      </File.Source>
    </File>
  )
}
```

:::
