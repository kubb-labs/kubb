---
layout: doc

title: PluginManager
outline: deep
---

# Жизненный цикл

## pre

Указывает предшествующие плагины для текущего плагина. Вы можете передать массив имен предшествующих плагинов, и текущий плагин будет выполнен после этих плагинов.<br/>

Может использоваться для валидации зависимых плагинов.

```typescript
pre: string[]
```

## post

Указывает последующие плагины для текущего плагина. Вы можете передать массив имен последующих плагинов, и текущий плагин будет выполнен перед этими плагинами.

```typescript
post: string[]
```

## buildStart

`hookParallel`: начало жизненного цикла плагина.
BuildStart используется для реализации вашей логики трансформации и также является единственным местом, где вы можете запустить _this.addFile_.

```typescript
buildStart: (this: PluginContext, kubbConfig: KubbConfig) => WithPromise<void>
```

## resolvePath

`hookFirst`: разрешить в id на основе fileName (пример: `./Pet.ts`) и directory (пример: `./models`).

```typescript
resolvePath: (this: PluginContext, fileName: string, directory?: string, options?: Record<string, any>) => string | null | undefined
```

## resolveName

`hookFirst`: разрешить в имя на основе строки. Полезно при преобразовании в PascalCase или camelCase.

```typescript
resolveName: (this: PluginContext, name: string, type?: string) => string
```

## load

`hookFirst`: позволяет запустить асинхронную логику для переопределения пути, определенного ранее с помощью `resolvePath`.

```typescript
load: (this: PluginContext, path: Path) => WithPromise<TransformResult | null>
```

## transform

`hookReduceArg0`: преобразовать исходный код.

```typescript
transform: (this: PluginContext, source: string, path: Path) => WithPromise<TransformResult>
```

## writeFile

`hookParallel`: записать результат в файловую систему на основе id (определенного `resolvePath` или измененного `load`).

```typescript
writeFile: (this: PluginContext, source: string | undefined, path: Path) => WithPromise<void>
```

## buildEnd

`hookParallel`: конец жизненного цикла плагина.

```typescript
buildEnd: (this: PluginContext) => WithPromise<void>
```

Вдохновлено: [rollup.netlify.app/guide/en/#build-hooks](https://deploy-preview-230--rollup.netlify.app/guide/en/#build-hooks)
