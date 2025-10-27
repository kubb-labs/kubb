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
`baseName` или `path` можно использовать, но нельзя использовать их вместе!
:::


```tsx
import React from "react"
import { File } from '@kubb/react'

type Props = React.ComponentProps<typeof File>
```

| свойство | описание                                                                                                            | тип                               | по умолчанию          |
|----------|---------------------------------------------------------------------------------------------------------------------|-----------------------------------|-----------------------|
| baseName | имя, которое будет использоваться для динамического создания baseName (на основе input.path).                       | `string`                          | -                     |
| banner   | добавить текст в начале файла.                                                                                      | `string`                          | -                     |
| footer   | добавить текст в конце файла.                                                                                       | `string`                          | -                     |
| path     | путь будет полным квалифицированным путем к указанному файлу.                                                       | `string`                          | -                     |
| override | это вызовет fileManager.add вместо fileManager.addOrAppend, добавляя исходник, когда файлы уже существуют.         | `boolean \|  undefined`           | `false`               |
| meta     | добавить дополнительные метаданные к файлу.                                                                         | `object \|  undefined`            | -                     |
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

| свойство   | описание                                                                                                                | тип                       | по умолчанию |
|------------|-------------------------------------------------------------------------------------------------------------------------|---------------------------|--------------|
| name       | имя импорта для использования.<br/>примеры: `["useState"]`, `"React"`                                                  | `string \| Array<string>` | -            |
| path       | путь для импорта.<br/>примеры: `"@kubb/core"`                                                                          | `string`                  | -            |
| isTypeOnly | добавить префикс `type` к импорту, это приведет к: `import type { Type } from './path'`.                               | `boolean \|  undefined`   | -            |
| print      | когда true, вернет сгенерированный импорт. когда false, добавит импорт к экземпляру KubbFile (см. fileManager).        | `boolean \|  undefined`   | -            |
| root       | когда root установлен, он получит путь с помощью relative getRelativePath(root, path).                                 | `string \|  undefined`    | -            |

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

| свойство   | описание                                                                                                                | тип                                     | по умолчанию |
|------------|-------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|--------------|
| name       | имя импорта для использования.<br/>примеры: `["useState"]`, `"React"`                                                  | `string \| Array<string> \|  undefined` | -            |
| path       | путь для импорта.<br/>примеры: `"@kubb/core"`                                                                          | `string`                                | -            |
| isTypeOnly | добавить префикс `type` к импорту, это приведет к: `import type { Type } from './path'`.                               | `boolean \|  undefined`                 | -            |
| asAlias    | позволяет переопределить имя, это приведет к: `export * as aliasName from './path'`                                    | `boolean \|  undefined`                 | -            |
| print      | когда true, вернет сгенерированный импорт. когда false, добавит импорт к экземпляру KubbFile (см. fileManager).        | `boolean \|  undefined`                 | -            |

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
`path` или `children` можно использовать, но нельзя использовать их вместе!
:::

```tsx
import React from "react"
import { File } from '@kubb/react'

type Props = React.ComponentProps<typeof File.Source>
```

| свойство       | описание                                                                                                                | тип        | по умолчанию |
|----------------|-------------------------------------------------------------------------------------------------------------------------|------------|--------------|
| path           | когда path установлен, он скопирует-вставит этот файл как строку внутри компонента.                                     | `string`   | -            |
| print          | когда true, вернет сгенерированный импорт. когда false, добавит импорт к экземпляру KubbFile (см. fileManager).        | `boolean`  | -            |
| removeComments | удаляет комментарии.                                                                                                    | `boolean`  | -            |
| noEmitHelpers  | при установке может переопределить вывод компилятора TypeScript.                                                        | `boolean`  | -            |
| children       |                                                                                                                         | `KubbNode` | -            |
