[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / WatchOfFilesAndCompilerOptions

# WatchOfFilesAndCompilerOptions\<T\>

Creates the watch that generates program using the root files and compiler options

## Extends

- [`Watch`](Watch.md)\<`T`\>

## Type Parameters

• **T**

## Methods

### close()

```ts
close(): void
```

Closes the watch

#### Returns

`void`

#### Inherited from

[`Watch`](Watch.md).[`close`](Watch.md#close)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9800

***

### getProgram()

```ts
getProgram(): T
```

Synchronize with host and get updated program

#### Returns

`T`

#### Inherited from

[`Watch`](Watch.md).[`getProgram`](Watch.md#getprogram)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9798

***

### updateRootFileNames()

```ts
updateRootFileNames(fileNames): void
```

Updates the root files in the program, only if this is not config file compilation

#### Parameters

• **fileNames**: `string`[]

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9812
