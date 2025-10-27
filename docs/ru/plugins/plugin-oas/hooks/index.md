---
layout: doc

title: \@kubb/plugin-oas
outline: deep
---

# Хуки

Некоторые хуки, которые можно использовать с `@kubb/plugin-oas`.<br/>
См. [Oas](https://github.com/readmeio/oas) для понимания того, как использовать экземпляр `Oas` или схемы `Oas`.

## useOas

`useOas` вернет экземпляр Oas.<br/>

```tsx
import { useOas } from '@kubb/plugin-oas/hooks'

function Component() {
  const oas = useOas()

  return null
}
```

## useOperation

`useOperation` вернет текущую `Operation`.<br/>

```tsx
import { useOperation } from '@kubb/plugin-oas/hooks'

function Component() {
  const operation = useOperation()

  const { path, method, schema, contentType, getRequestBody, getOperationId } = operation;

  return null
}
```

## useOperations

`useOperations` вернет все Operations.<br/>

```tsx
import { useOperations } from '@kubb/plugin-oas/hooks'

function Component() {
  const operations = useOperations()

  return null
}
```


## useOperationManager

`useOperationManager` вернет некоторые вспомогательные функции, которые можно использовать для получения файла операции, получения имени операции.<br/>


```tsx
import { useOperationManager } from '@kubb/plugin-oas/hooks'

function Component() {
  const { getName, getFile, getSchemas, groupSchemasByByName } = useOperationManager()

  return null
}
```

## useSchema

`useSchema` вернет текущую `Schema`.<br/>

```tsx
import { useOperationManager } from '@kubb/plugin-oas/hooks'

function Component() {
  const { name, schema, tree } = useSchema()

  return null
}
```

## useSchemaManager

`useSchemaManager` вернет некоторые вспомогательные функции, которые можно использовать для получения дополнительной информации о схеме.<br/>


```tsx
import { useSchemaManager } from '@kubb/plugin-oas/hooks'

function Component() {
  const { getName, getFile, getImports } = useOperationManager()

  return null
}
```
