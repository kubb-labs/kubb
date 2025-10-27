---
layout: doc

title: \@kubb/react
outline: deep
---

# @kubb/react <a href="https://paka.dev/npm/@kubb/react@latest/api">🦙</a>

используйте React для создания шаблонов/вариантов для любого плагина.

<hr/>

## Установка

::: code-group

```shell [bun]
bun add -d @kubb/react
```

```shell [pnpm]
pnpm add -D @kubb/react
```

```shell [npm]
npm install --save-dev @kubb/react
```

```shell [yarn]
yarn add -D @kubb/react
```

:::

<hr/>

### Настройка `tsconfig.json`

::: code-group

```json [tsconfig.json]
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@kubb/react" // [!code ++]
  }
}
```

### импорт `@kubb/react` вместо `react`
```typescript
import React from 'react'  // [!code --]
import React from '@kubb/react' // [!code ++]

```

:::
