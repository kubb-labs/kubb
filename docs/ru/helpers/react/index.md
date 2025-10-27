---
layout: doc

title: \@kubb/react
outline: deep
---

# @kubb/react

назначение `@kubb/react` заключается в предоставлении набора инструментов и компонентов, специально разработанных для создания приложений с помощью React в рамках фреймворка Kubb. вот ключевые аспекты его функциональности:

1. JSX: используйте JSX для создания файлов, используя при этом мощь Kubb для оркестрации.
2. библиотека компонентов: включает предварительно созданные компоненты, которые можно использовать при генерации файлов.
3. типобезопасность: поскольку он построен на TypeScript, `@kubb/react` обеспечивает типобезопасность.
4. независимость от Kubb: `@kubb/react` можно использовать без необходимости использования `@kubb/core` или файла `kubb.config.ts`.
5. DevTools: поскольку мы используем React, вы можете легко подключить React DevTools, см. [Отладка Kubb](/ru/knowledge-base/debugging).

в общем, `@kubb/react` служит мостом между фреймворком Kubb и React, предлагая инструменты, компоненты и типобезопасность для упрощения создания файлов.

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

### Использование
TODO

:::
