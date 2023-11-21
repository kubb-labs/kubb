---
layout: doc

title: \@kubb/react
outline: deep
---

# Type

::: code-group

```tsx [simple]
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

return root.output
```

:::

::: code-group

```typescript [simple]
type Data = string
```

:::

## API

| Property | Description                                                  | Type                     | Default |
| -------- | ------------------------------------------------------------ | ------------------------ | ------- |
| name     | Name of the type, this needs to start with a capital letter. | `string`                 | -       |
| export   | Does this type need to be exported.                          | `boolean \|  undefined`  | -       |
| JSDoc    | Options for JSdocs                                           | `JSDoc \|  undefined`    | -       |
| children |                                                              | `KubbNode \|  undefined` | -       |
