---
layout: doc

title: \@kubb/react
outline: deep
---

# Editor

## Editor

::: code-group

```tsx [simple]
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

return root.output
```

:::

::: code-group

```typescript [simple]
export const test = 2
```

:::

## API

| Property | Description                | Type                               | Default |
| -------- | -------------------------- | ---------------------------------- | ------- |
| language | Name of the language used. | `typescript' \| 'text' \|  string` | -       |
| children |                            | `KubbNode \|  undefined`           | -       |
