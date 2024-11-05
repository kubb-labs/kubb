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

| Property | Description                                                  | Type                     | Default |
|----------| ------------------------------------------------------------ | ------------------------ | ------- |
| name     | Name of the type, this needs to start with a capital letter. | `string`                 | -       |
| export   | Does this type need to be exported.                          | `boolean \|  undefined`  | -       |
| asConst  | Use of `const` assertions                          | `boolean \|  undefined`  | -       |
| JSDoc    | Options for JSdocs                                           | `JSDoc \|  undefined`    | -       |
| children |                                                              | `KubbNode \|  undefined` | -       |
