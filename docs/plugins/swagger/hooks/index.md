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

## useOperations

`useOperations` will return all the Operations.<br/>

::: code-group

```typescript
import { useOperations } from '@kubb/react'

function Component() {
  const operations = useOperations()

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

## useOperationHelpers

`useOperationHelpers` will return some helper functions that can be used to get the operation file, get the operation name.<br/>

::: code-group

```typescript
import { useOperationHelpers } from '@kubb/react'

function Component() {
  const { getName, getFile } = useOperationHelpers()

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

## useGetOperationFile

`useGetOperationFile` will create all the props used for `<File/>` based on the current operation and plugin(when `pluginKey` is not provided)<br/>

::: tip
Internally `useFile` of `@kubb/react` is getting used.
:::

::: code-group

```typescript
import { File, useGetOperationFile } from '@kubb/react'

function Component() {
  const file = useGetOperationFile({
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
