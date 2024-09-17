[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createWatchProgram

# createWatchProgram()

## createWatchProgram(host)

```ts
function createWatchProgram<T>(host): WatchOfFilesAndCompilerOptions<T>
```

Creates the watch from the host for root files and compiler options

### Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

### Parameters

• **host**: [`WatchCompilerHostOfFilesAndCompilerOptions`](../interfaces/WatchCompilerHostOfFilesAndCompilerOptions.md)\<`T`\>

### Returns

[`WatchOfFilesAndCompilerOptions`](../interfaces/WatchOfFilesAndCompilerOptions.md)\<`T`\>

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9670

## createWatchProgram(host)

```ts
function createWatchProgram<T>(host): WatchOfConfigFile<T>
```

Creates the watch from the host for config file

### Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

### Parameters

• **host**: [`WatchCompilerHostOfConfigFile`](../interfaces/WatchCompilerHostOfConfigFile.md)\<`T`\>

### Returns

[`WatchOfConfigFile`](../interfaces/WatchOfConfigFile.md)\<`T`\>

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9674
