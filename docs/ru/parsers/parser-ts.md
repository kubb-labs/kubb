---
layout: doc

title: \@kubb/parser-ts
outline: deep
---

# @kubb/parser-ts

Эта библиотека содержит строительные блоки, которые можно использовать для создания кода TypeScript. Все это основано на движке TypeScript AST.
Хорошим инструментом для визуализации того, что такое AST, является [TypeScript AST Viewer](https://ts-ast-viewer.com), здесь вы можете визуализировать AST на основе некоторого кода TypeScript.

Чтобы начать работу с TypeScript AST, я бы посоветовал следовать этому руководству: [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/).

## Установка

::: code-group
```shell [bun]
bun add -d @kubb/parser-ts
```

```shell [pnpm]
pnpm add -D @kubb/parser-ts
```

```shell [npm]
npm install --save-dev @kubb/parser-ts
```

```shell [yarn]
yarn add -D @kubb/parser-ts
```
:::

## API
- `print`: преобразование узлов AST TypeScript в строку на основе принтера TypeScript.
- `format`: форматирование сгенерированного кода на основе принтера TypeScript.

## Ссылки

- [TypeScript AST Viewer](https://ts-ast-viewer.com)
- [Generating TypeScript using AST's](https://nabeelvalley.co.za/docs/javascript/typescript-ast/)
