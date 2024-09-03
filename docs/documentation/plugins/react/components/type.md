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

| Property | Description                                                  | Type                     | Default |
| -------- | ------------------------------------------------------------ | ------------------------ | ------- |
| name     | Name of the type, this needs to start with a capital letter. | `string`                 | -       |
| export   | Does this type need to be exported.                          | `boolean \|  undefined`  | -       |
| JSDoc    | Options for JSdocs                                           | `JSDoc \|  undefined`    | -       |
| children |                                                              | `KubbNode \|  undefined` | -       |
