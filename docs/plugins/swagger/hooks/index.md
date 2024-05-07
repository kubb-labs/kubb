---
layout: doc

title: \@kubb/swagger
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/swagger`.<br/>
See [Oas](https://github.com/readmeio/oas) to understand how to use the `Oas` instance or the `Oas` schemas.

## useOas

`useOas` will return the Oas instance.<br/>

::: code-group

```tsx twoslash
import { useOas } from '@kubb/swagger/hooks'

function Component() {
  const oas = useOas()

  return null
}
```

:::

## useOperation

`useOperation` will return the current `Operation`.<br/>

::: code-group

```tsx twoslash
import { useOperation } from '@kubb/swagger/hooks'

function Component() {
  const operation = useOperation()

  const { path, method, schema, contentType, getRequestBody, getOperationId } = operation;

  return null
}
```

:::

## useOperations

`useOperations` will return all the Operations.<br/>

::: code-group

```tsx twoslash
import { useOperations } from '@kubb/swagger/hooks'

function Component() {
  const operations = useOperations()

  return null
}
```

:::


## useOperationManager

`useOperationManager` will return some helper functions that can be used to get the operation file, get the operation name.<br/>

::: code-group

```tsx twoslash
import { useOperationManager } from '@kubb/swagger/hooks'

function Component() {
  const { getFile, getName, getSchemas, groupSchemasByByName } = useOperationManager()

  return null
}
```

:::
