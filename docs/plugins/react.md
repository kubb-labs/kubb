---
layout: doc

title: \@kubb/react
outline: deep
---

# @kubb/react <a href="https://paka.dev/npm/@kubb/react@latest/api">🦙</a><Badge type="warning" text="under construction" />

Use React to create templates/variants for any plugin.

<hr/>

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/react
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/react
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/react
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/react
```

:::

<hr/>

### Configure `tsconfig.json`

::: code-group

```json [tsconfig.json]
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@kubb/react" // [!code ++]
  }
}
```

:::

## Examples

### Text

#### Input

::: code-group

```tsx [simple]
import { createRoot, Text } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Text>
     export const test = 2;
    </File>
  )
}

root.render(<Component />)

return root.output
```

:::

#### Output

::: code-group

```typescript [simple]
export const test = 2
```

:::

### Text with indent

#### Input

::: code-group

```tsx [simple]
import { createRoot, Text } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return (
    <Text indentSize={2}>
     export const test = 2;
    </File>
  )
}

root.render(<Component />)

return root.output
```

:::

#### Output

::: code-group

```typescript [simple]
export const test = 2
```

:::

### Function

#### Input

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

#### Output

::: code-group

```typescript [simple]
export async function getData() {
  return 2
}
```

:::

### File

#### Input

::: code-group

```tsx [simple]
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

return root.output
```

:::

#### Output

::: code-group

```typescript [simple]
export function test() {
  return true
}
```

:::

### File.Import

#### Input

::: code-group

```tsx [simple]
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return <File.Import name={'React'} path="react" print />
}

root.render(<Component />)

return root.output
```

```tsx [type]
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return <File.Import name={'React'} path="react" isTypeOnly print />
}

root.render(<Component />)

return root.output
```

:::

#### Output

::: code-group

```typescript [simple]
import React from 'react'
```

```typescript [type]
import type React from 'react'
```

:::

### File.Export

#### Input

::: code-group

```tsx [simple]
import { createRoot, File } from '@kubb/react'

const root = createRoot()

const Component = () => {
  return <File.Export path="kubb" print />
}

root.render(<Component />)

return root.output
```

:::

#### Output

::: code-group

```typescript [simple]
export * from 'kubb'
```

:::

### File.Source

#### Input

::: code-group

```tsx [simple]
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

return root.output
```

```tsx [from file]
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

return root.output
```

:::

#### Output

::: code-group

```typescript [simple]
test
```

```typescript[from file]
export const resultFromTestDotTs = "hello world";
```

:::

## Links
