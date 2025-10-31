---
layout: doc

title: \@kubb/core
outline: deep
---

# @kubb/core
Ядро содержит строительные блоки для всех плагинов.

## Установка

::: code-group

```shell [bun]
bun add -d @kubb/core
```

```shell [pnpm]
pnpm add -D @kubb/core
```

```shell [npm]
npm install --save-dev @kubb/core
```

```shell [yarn]
yarn add -D @kubb/core
```

:::

## Использование

```typescript
import { write } from '@kubb/fs'
import { build, getSource } from '@kubb/core'

const { error, files, pluginManager } = await build({
  config: {
    root: '.',
    input: {
      data: '',
    },
    output: {
      path: './gen',
    },
  },
})


for (const file of files) {
  const source = await getSource(file)

  await write(file.path, file)
}
```

Запускает процесс сборки на основе определенной конфигурации (см. тип [UserConfig](https://github.com/kubb-labs/kubb/blob/main/packages/core/src/config.ts)).
Это запустит различные плагины и их созданные методы жизненного цикла.
