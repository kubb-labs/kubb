---
layout: doc

title: \@kubb/react
outline: deep
---

# Type

```tsx
import React from "react"
import { createRoot, Type } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Type name="Data">
      string
    </Type>
  )
}

root.render(<Component />)
root.output
//   ^?
```


```typescript
type Data = string
```

## API

```tsx
import React from "react"
import { Type } from '@kubb/react'

type Props = React.ComponentProps<typeof Type>
```

| свойство | описание                                                 | тип                      | по умолчанию |
|----------|----------------------------------------------------------|--------------------------|--------------|
| name     | имя типа, должно начинаться с заглавной буквы.           | `string`                 | -            |
| export   | нужно ли экспортировать этот тип.                        | `boolean \|  undefined`  | -            |
| JSDoc    | опции для JSdocs                                         | `JSDoc \|  undefined`    | -            |
| children |                                                          | `KubbNode \|  undefined` | -            |
