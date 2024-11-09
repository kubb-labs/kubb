---
layout: doc

title: \@kubb/react
outline: deep
---

# File

## File

```tsx
import React from "react"
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <File baseName="test.ts" path="path">
      <File.Import name={'React'} path="react" print />
    </File>
  )
}

root.render(<Component />)
root.output
//   ^?
```


```typescript
export function test() {
  return true
}
```


### API

::: warning
`baseName` or `path` can be used, you can not use them together!
:::


```tsx
import React from "react"
import { File } from '@kubb/react'

type Props = React.ComponentProps<typeof File>
```

| Property | Description                                                                                                         | Type                              | Default               |
|----------|---------------------------------------------------------------------------------------------------------------------| --------------------------------- | --------------------- |
| baseName | Name to be used to dynamicly create the baseName(based on input.path).                                              | `string`                          | -                     |
| banner   | Add some text in the beginning of the file.                                                                         | `string`                          | -                     |
| footer   | Add some text at the end of the file.                                                                               | `string`                          | -                     |
| path     | Path will be full qualified path to a specified file.                                                               | `string`                          | -                     |
| override | This will call fileManager.add instead of fileManager.addOrAppend, adding the source when the files already exists. | `boolean \|  undefined`           | `false`               |
| meta     | Add extra meta to a file.                                                                                           | `object \|  undefined`            | -                     |
| children |                                                                                                                     | `KubbNode \|  undefined`          | -                     |

## File.Import

::: code-group

```tsx [simple]
import React from "react"
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return <File.Import name={'React'} path="react" print />
}

root.render(<Component />)
root.output
//   ^?
```

```tsx [type]
import React from "react"
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return <File.Import name={'React'} path="react" isTypeOnly print />
}

root.render(<Component />)
root.output
//   ^?
```

:::

::: code-group

```typescript [simple]
import React from 'react'
```

```typescript [type]
import type React from 'react'
```

:::

### API

```tsx
import React from "react"
import { File } from '@kubb/react'

type Props = React.ComponentProps<typeof File.Import>
```

| Property   | Description                                                                                                                 | Type                      | Default |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------- |
| name       | Import name to be used.<br/>Examples: `["useState"]`, `"React"`                                                             | `string \| Array<string>` | -       |
| path       | Path for the import.<br/>Examples: `"@kubb/core"`                                                                           | `string`                  | -       |
| isTypeOnly | Add `type` prefix to the import, this will result in: `import type { Type } from './path'`.                                 | `boolean \|  undefined`   | -       |
| print      | When true, it will return the generated import. When false, it will add the import to a KubbFile instance(see fileManager). | `boolean \|  undefined`   | -       |
| root       | When root is set it will get the path with relative getRelativePath(root, path).                                            | `string \|  undefined`    | -       |

## File.Export


```tsx
import React from "react"
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return <File.Export path="kubb" print />
}

root.render(<Component />)
root.output
//   ^?
```

```typescript [simple]
export * from 'kubb'
```

### API

```tsx
import React from "react"
import { File } from '@kubb/react'

type Props = React.ComponentProps<typeof File.Export>
```

| Property   | Description                                                                                                                 | Type                                    | Default |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------- |
| name       | Import name to be used.<br/>Examples: `["useState"]`, `"React"`                                                             | `string \| Array<string> \|  undefined` | -       |
| path       | Path for the import.<br/>Examples: `"@kubb/core"`                                                                           | `string`                                | -       |
| isTypeOnly | Add `type` prefix to the import, this will result in: `import type { Type } from './path'`.                                 | `boolean \|  undefined`                 | -       |
| asAlias    | Make it possible to override the name, this will result in: `export * as aliasName from './path'`                           | `boolean \|  undefined`                 | -       |
| print      | When true, it will return the generated import. When false, it will add the import to a KubbFile instance(see fileManager). | `boolean \|  undefined`                 | -       |

## File.Source

::: code-group

```tsx [children]
import React from "react"
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <File baseName="test.ts" path="path">
      <File.Source>test</File.Source>
    </File>
  )
}

root.render(<Component />)
root.output
//   ^?
```

```tsx [path]
import React from "react"
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <File baseName="test.ts" path="path">
      <File.Source path={path.resolve(__dirname, './test.ts')} print></File.Source>
    </File>
  )
}

root.render(<Component />)
root.output
//   ^?
```

:::

::: code-group

```typescript [children]
test
```

```typescript[path]
export const resultFromTestDotTs = "hello world";
```

:::

### API

::: warning
`path` or `children` can be used, you can not use them together!
:::

```tsx
import React from "react"
import { File } from '@kubb/react'

type Props = React.ComponentProps<typeof File.Source>
```

| Property       | Description                                                                                                                 | Type       | Default |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| path           | When path is set it will copy-paste that file as a string inside the component.                                             | `string`   | -       |
| print          | When true, it will return the generated import. When false, it will add the import to a KubbFile instance(see fileManager). | `boolean`  | -       |
| removeComments | Removes comments.                                                                                                           | `boolean`  | -       |
| noEmitHelpers  | When set it can override the print of the TypeScript compiler.                                                              | `boolean`  | -       |
| children       |                                                                                                                             | `KubbNode` | -       |
