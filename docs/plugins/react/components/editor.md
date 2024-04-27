---
layout: doc

title: \@kubb/react
outline: deep
---

# Editor

```tsx twoslash
import React from "react"
import { createRoot, Editor } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Editor language="text">
      export const test = 2
    </Editor>
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
import { Editor } from '@kubb/react'

type Props = React.ComponentProps<typeof Editor>
```

| Property | Description                | Type                               | Default |
| -------- | -------------------------- | ---------------------------------- | ------- |
| language | Name of the language used. | `typescript' \| 'text' \|  string` | -       |
| children |                            | `KubbNode \|  undefined`           | -       |
