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


## useOperationManager

`useOperationManager` will return some helper functions that can be used to get the operation file, get the operation name.<br/>

::: code-group

```typescript
import { useOperationManager } from '@kubb/react'

function Component() {
  const { getName, getFile } = useOperationManager()

  return null
}
```

:::
