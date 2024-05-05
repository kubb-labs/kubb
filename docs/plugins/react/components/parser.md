---
layout: doc

title: \@kubb/react
outline: deep
---

# Editor

```tsx twoslash
import React from "react"
import { createRoot, Parser } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Parser language="text">
      export const test = 2
    </Parser>
  )
}

root.render(<Component />)
root.output
//   ^?
```

```typescript
export const test = 2
```


## API

```tsx twoslash
import React from "react"
import { Parser } from '@kubb/react'

type Props = React.ComponentProps<typeof Parser>
```

| Property | Description                | Type                               | Default |
| -------- | -------------------------- | ---------------------------------- | ------- |
| language | Name of the language used. | `typescript' \| 'text' \|  string` | -       |
| children |                            | `KubbNode \|  undefined`           | -       |
