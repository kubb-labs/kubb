---
layout: doc

title: \@kubb/plugin-oas
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/plugin-oas`.<br/>
See [Oas](https://github.com/readmeio/oas) to understand how to use the `Oas` instance or the `Oas` schemas.

## useOas

`useOas` will return the Oas instance.<br/>

```tsx
import { useOas } from '@kubb/plugin-oas/hooks'

function Component() {
  const oas = useOas()

  return null
}
```

## useOperation

`useOperation` will return the current `Operation`.<br/>

```tsx
import { useOperation } from '@kubb/plugin-oas/hooks'

function Component() {
  const operation = useOperation()

  const { path, method, schema, contentType, getRequestBody, getOperationId } = operation;

  return null
}
```

## useOperationManager

`useOperationManager` will return some helper functions that can be used to get the operation file, get the operation name.<br/>


```tsx
import { useOperationManager } from '@kubb/plugin-oas/hooks'

function Component() {
  const { getName, getFile, getSchemas, groupSchemasByByName } = useOperationManager()

  return null
}
```

## useSchema

`useSchema` will return the current `Schema`.<br/>

```tsx
import { useOperationManager } from '@kubb/plugin-oas/hooks'

function Component() {
  const { name, schema, tree } = useSchema()

  return null
}
```

## useSchemaManager

`useSchemaManager` will return some helper functions that can be used to get more information about a schema.<br/>


```tsx
import { useSchemaManager } from '@kubb/plugin-oas/hooks'

function Component() {
  const { getName, getFile, getImports } = useOperationManager()

  return null
}
```
