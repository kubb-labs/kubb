---
layout: doc

title: \@kubb/react
outline: deep
---

# Function

```tsx
import React from "react"
import { createRoot, Function } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Function name="getData" export async>
      return 2;
    </Function>
  )
}

root.render(<Component />)
root.output
//   ^?
```


```typescript
export async function getData() {
  return 2
}
```

## API

```tsx
import React from "react"
import { Function } from '@kubb/react'

type Props = React.ComponentProps<typeof Function>
```

| свойство   | описание                                                | тип                                | по умолчанию |
|------------|---------------------------------------------------------|------------------------------------|--------------|
| name       | имя функции.                                            | `string`                           | -            |
| default    | добавить default при использовании export               | `boolean \|  undefined`            | -            |
| params     | параметры/опции/props, которые нужно использовать.      | `string \|  undefined`             | -            |
| export     | нужно ли экспортировать эту функцию.                    | `boolean \|  undefined`            | -            |
| async      | имеет ли функция async/promise поведение.               | `boolean \|  undefined`            | -            |
| generics   | дженерики, которые нужно добавить для TypeScript.       | `string \| string[] \|  undefined` | -            |
| returnType | тип возвращаемого значения (см. async для типа Promise).| `string \|  undefined`             | -            |
| JSDoc      | опции для JSdocs                                        | `JSDoc \|  undefined`              | -            |
| children   |                                                         | `KubbNode \|  undefined`           | -            |
