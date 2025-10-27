---
layout: doc

title: \@kubb/react
outline: deep
---

# Const

```tsx
import React from "react"
import { createRoot, Const } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Const name="data">
        test
    </Const>
  )
}

root.render(<Component />)
root.output
//   ^?
```


```typescript
const data = "test"
```

## API

```tsx
import React from "react"
import { Const } from '@kubb/react'

type Props = React.ComponentProps<typeof Const>
```

| свойство | описание                                                         | тип                      | по умолчанию |
|----------|------------------------------------------------------------------|--------------------------|--------------|
| name     | имя типа, должно начинаться с заглавной буквы.                   | `string`                 | -            |
| export   | нужно ли экспортировать этот тип.                                | `boolean \|  undefined`  | -            |
| asConst  | использование утверждений `const`                                | `boolean \|  undefined`  | -            |
| JSDoc    | опции для JSdocs                                                 | `JSDoc \|  undefined`    | -            |
| children |                                                                  | `KubbNode \|  undefined` | -            |
