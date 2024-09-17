[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / MinimalResolutionCacheHost

# MinimalResolutionCacheHost

Used by services to specify the minimum host area required to set up source files under any compilation settings

## Extends

- [`ModuleResolutionHost`](ModuleResolutionHost.md)

## Extended by

- [`LanguageServiceHost`](LanguageServiceHost.md)

## Properties

### useCaseSensitiveFileNames?

```ts
optional useCaseSensitiveFileNames: boolean | () => boolean;
```

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`useCaseSensitiveFileNames`](ModuleResolutionHost.md#usecasesensitivefilenames)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`directoryExists`](ModuleResolutionHost.md#directoryexists)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`fileExists`](ModuleResolutionHost.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7167

***

### getCompilationSettings()

```ts
getCompilationSettings(): CompilerOptions
```

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7184

***

### getCompilerHost()?

```ts
optional getCompilerHost(): undefined | CompilerHost
```

#### Returns

`undefined` \| [`CompilerHost`](CompilerHost.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7185

***

### getCurrentDirectory()?

```ts
optional getCurrentDirectory(): string
```

#### Returns

`string`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getCurrentDirectory`](ModuleResolutionHost.md#getcurrentdirectory)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getDirectories`](ModuleResolutionHost.md#getdirectories)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`readFile`](ModuleResolutionHost.md#readfile)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`realpath`](ModuleResolutionHost.md#realpath)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`trace`](ModuleResolutionHost.md#trace)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7169
