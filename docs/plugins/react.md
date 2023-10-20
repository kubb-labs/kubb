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

```tsx [input]
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

return root
```

::: code-group

```typescript [root.output]
export const test = 2;
```

:::


### Text with indent

```tsx [input]
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

return root
```

::: code-group

```typescript [root.output]
    export const test = 2;
```
:::

### Function
```tsx [input]
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

return root
```

::: code-group
```typescript [root.output]
export async function getData() {
  return 2;
};
```

:::


### File

```tsx [input]
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

return root
```
::: code-group

```typescript [root.output]
export function test() {
  return true
}
```

:::

## Links
