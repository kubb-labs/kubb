---
layout: doc

title: \@kubb/react
outline: deep
---

# Text

::: code-group

```tsx [simple]
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

return root.output
```

:::

::: code-group

```typescript [simple]
export const test = 2
```

:::

# Text with indent

::: code-group

```tsx [simple]
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

return root.output
```

:::

::: code-group

```typescript [simple]
export const test = 2
```

:::

## API

| Property   | Description        | Type                     | Default |
| ---------- | ------------------ | ------------------------ | ------- |
| indentSize | Change the indent. | `number \|  undefined`   | `0`     |
| children   |                    | `KubbNode \|  undefined` | -       |
