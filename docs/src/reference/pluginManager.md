---
layout: doc

title: PluginManager
outline: deep
---

# PluginManager <Badge type="info" text="@kubb/core" />

::: warning
 Under construction
:::

[Type system](https://github.com/kubb-project/kubb/blob/main/packages/core/src/types.ts)


## 1. validate

`hookParallel`: Valdiate all plugins to see if their depended plugins are installed and configured.

```typescript
  validate: (this: PluginContext, plugins: Plugin[]) => WithPromise<ValidationResult>
```

## 2. buildStart

`hookParallel`: Start of the lifecycle of a plugin.
BuildStart is used to implement your transformation logic and also the only place where you can run *this.addFile*.

```typescript
  buildStart: (this: PluginContext, kubbConfig: KubbConfig) => WithPromise<void>
```

## 3. resolvePath

`hookFirst`: Resolve to an id based on fileName(example: `./Pet.ts`) and directory(example: `./models`). 

```typescript
 resolvePath: (this: PluginContext, fileName: string, directory?: string, options?: Record<string, any>) => string | null | undefined
```

## 4. resolveName

`hookFirst`: Resolve to a name based on a string. Useful when converting to PascalCase or camelCase.

```typescript
 resolveName: (this: PluginContext, name: string) => string
```

## 5. load

`hookFirst`: Makes it possible to run async logic to override the path defined previously by `resolvePath`.

```typescript
  load: (this: PluginContext, path: Path) => WithPromise<TransformResult | null>
```

## 6. transform

`hookReduceArg0`: Transform the source-code.

```typescript
  transform: (this: PluginContext, source: string, path: Path) => WithPromise<TransformResult>
```

## 7. writeFile

`hookParallel`: Write the result to the file-system based on the id(defined by `resolvePath` or changed by `load`).

```typescript
  writeFile: (this: PluginContext, source: string | undefined, path: Path) => WithPromise<void>
```

## 8. buildEnd

`hookParallel`: End of the plugin lifecycle.

```typescript
  buildEnd: (this: PluginContext) => WithPromise<void>
```

Inspired by: [rollup.netlify.app/guide/en/#build-hooks](https://deploy-preview-230--rollup.netlify.app/guide/en/#build-hooks)