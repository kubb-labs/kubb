---
layout: doc

title: \@kubb/react
outline: deep
---

# Function

::: code-group

```tsx [simple]
import { createRoot, Function } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Function name="getData" export async>
      return 2;
    </Function>
  )
}

root.render(<Component />)

return root.output
```

:::

::: code-group

```typescript [simple]
export async function getData() {
  return 2
}
```

:::

## API

| Property   | Description                                     | Type                               | Default |
| ---------- | ----------------------------------------------- | ---------------------------------- | ------- |
| name       | Name of the function.                           | `string`                           | -       |
| params     | Parameters/options/props that need to be used.  | `string \|  undefined`             | -       |
| export     | Does this function need to be exported.         | `boolean \|  undefined`            | -       |
| async      | Does the function has async/promise behaviour.  | `boolean \|  undefined`            | -       |
| generics   | Generics that needs to be added for TypeScript. | `string \| string[] \|  undefined` | -       |
| returnType | ReturnType(see async for adding Promise type).  | `string \|  undefined`             | -       |
| JSDoc      | Options for JSdocs                              | `JSDoc \|  undefined`              | -       |
| children   |                                                 | `KubbNode \|  undefined`           | -       |
