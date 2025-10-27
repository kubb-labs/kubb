---
layout: doc

title: \@kubb/react
outline: deep
---

# Text

## Text


```tsx
import React from "react"
import { createRoot, Text } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Text>
      export const test = 2;
    </Text>
  )
}

root.render(<Component />)
root.output
//   ^?
```


```typescript
export const test = 2
```

## Text с отступом


```tsx
import React from "react"
import { createRoot, Text } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Text indentSize={2}>
      export const test = 2;
    </Text>
  )
}

root.render(<Component />)
root.output
//   ^?
```

```typescript [simple]
export const test = 2
```


## API

```tsx
import React from "react"
import { Text } from '@kubb/react'

type Props = React.ComponentProps<typeof Text>
```

| свойство   | описание           | тип                      | по умолчанию |
|------------|--------------------|--------------------------|--------------|
| indentSize | изменить отступ.   | `number \|  undefined`   | `0`          |
| children   |                    | `KubbNode \|  undefined` | -            |
