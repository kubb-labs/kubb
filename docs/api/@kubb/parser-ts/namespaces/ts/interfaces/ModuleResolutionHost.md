[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ModuleResolutionHost

# ModuleResolutionHost

## Extended by

- [`ParseConfigHost`](ParseConfigHost.md)
- [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)
- [`CompilerHost`](CompilerHost.md)

## Properties

### useCaseSensitiveFileNames?

```ts
optional useCaseSensitiveFileNames: boolean | () => boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7178

## Methods

### directoryExists()?

```ts
optional directoryExists(directoryName): boolean
```

#### Parameters

• **directoryName**: `string`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7170

***

### fileExists()

```ts
fileExists(fileName): boolean
```

#### Parameters

• **fileName**: `string`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7167

***

### getCurrentDirectory()?

```ts
optional getCurrentDirectory(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7176

***

### getDirectories()?

```ts
optional getDirectories(path): string[]
```

#### Parameters

• **path**: `string`

#### Returns

`string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7177

***

### readFile()

```ts
readFile(fileName): undefined | string
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| `string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7168

***

### realpath()?

```ts
optional realpath(path): string
```

Resolve a symbolic link.

#### Parameters

• **path**: `string`

#### Returns

`string`

#### See

https://nodejs.org/api/fs.html#fs_fs_realpathsync_path_options

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7175

***

### trace()?

```ts
optional trace(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7169
