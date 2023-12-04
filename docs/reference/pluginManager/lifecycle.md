---
layout: doc

title: PluginManager
outline: deep
---

# Lifecycle

## pre

Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin will be executed after these plugins.<br/>

Can be used to validate depended plugins.

```typescript
pre: string[]
```

## post

Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin will be executed before these plugins.

```typescript
post: string[]
```

## buildStart

`hookParallel`: Start of the lifecycle of a plugin.
BuildStart is used to implement your transformation logic and also the only place where you can run _this.addFile_.

```typescript
buildStart: (this: PluginContext, kubbConfig: KubbConfig) => WithPromise<void>
```

## resolvePath

`hookFirst`: Resolve to an id based on fileName(example: `./Pet.ts`) and directory(example: `./models`).

```typescript
resolvePath: (this: PluginContext, fileName: string, directory?: string, options?: Record<string, any>) => string | null | undefined
```

## resolveName

`hookFirst`: Resolve to a name based on a string. Useful when converting to PascalCase or camelCase.

```typescript
resolveName: (this: PluginContext, name: string, type?: string) => string
```

## load

`hookFirst`: Makes it possible to run async logic to override the path defined previously by `resolvePath`.

```typescript
load: (this: PluginContext, path: Path) => WithPromise<TransformResult | null>
```

## transform

`hookReduceArg0`: Transform the source-code.

```typescript
transform: (this: PluginContext, source: string, path: Path) => WithPromise<TransformResult>
```

## writeFile

`hookParallel`: Write the result to the file-system based on the id(defined by `resolvePath` or changed by `load`).

```typescript
writeFile: (this: PluginContext, source: string | undefined, path: Path) => WithPromise<void>
```

## buildEnd

`hookParallel`: End of the plugin lifecycle.

```typescript
buildEnd: (this: PluginContext) => WithPromise<void>
```

Inspired by: [rollup.netlify.app/guide/en/#build-hooks](https://deploy-preview-230--rollup.netlify.app/guide/en/#build-hooks)
