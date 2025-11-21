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

## useOperationManager

`useOperationManager` will return some helper functions that can be used to get the operation file, get the operation name.<br/>


```tsx
import { useOperationManager } from '@kubb/plugin-oas/hooks'

function Component() {
  const { getName, getFile, getSchemas, groupSchemasByByName } = useOperationManager(generator)

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
