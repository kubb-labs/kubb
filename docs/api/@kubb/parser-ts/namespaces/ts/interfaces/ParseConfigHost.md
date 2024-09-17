[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ParseConfigHost

# ParseConfigHost

## Extends

- [`ModuleResolutionHost`](ModuleResolutionHost.md)

## Extended by

- [`ParseConfigFileHost`](ParseConfigFileHost.md)

## Properties

### useCaseSensitiveFileNames

```ts
useCaseSensitiveFileNames: boolean;
```

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`useCaseSensitiveFileNames`](ModuleResolutionHost.md#usecasesensitivefilenames)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5923

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
fileExists(path): boolean
```

Gets a value indicating whether the specified path exists and is a file.

#### Parameters

• **path**: `string`

The path to test.

#### Returns

`boolean`

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`fileExists`](ModuleResolutionHost.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5929

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

### readDirectory()

```ts
readDirectory(
   rootDir, 
   extensions, 
   excludes, 
   includes, 
   depth?): readonly string[]
```

#### Parameters

• **rootDir**: `string`

• **extensions**: readonly `string`[]

• **excludes**: `undefined` \| readonly `string`[]

• **includes**: readonly `string`[]

• **depth?**: `number`

#### Returns

readonly `string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5924

***

### readFile()

```ts
readFile(path): undefined | string
```

#### Parameters

• **path**: `string`

#### Returns

`undefined` \| `string`

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`readFile`](ModuleResolutionHost.md#readfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5930

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

#### Overrides

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`trace`](ModuleResolutionHost.md#trace)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5931
