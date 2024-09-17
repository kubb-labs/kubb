[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ParseConfigFileHost

# ParseConfigFileHost

Interface extending ParseConfigHost to support ParseConfigFile that reads config file and reports errors

## Extends

- [`ParseConfigHost`](ParseConfigHost.md).[`ConfigFileDiagnosticsReporter`](ConfigFileDiagnosticsReporter.md)

## Properties

### onUnRecoverableConfigFileDiagnostic

```ts
onUnRecoverableConfigFileDiagnostic: DiagnosticReporter;
```

Reports unrecoverable error when parsing config file

#### Inherited from

[`ConfigFileDiagnosticsReporter`](ConfigFileDiagnosticsReporter.md).[`onUnRecoverableConfigFileDiagnostic`](ConfigFileDiagnosticsReporter.md#onunrecoverableconfigfilediagnostic)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9185

***

### useCaseSensitiveFileNames

```ts
useCaseSensitiveFileNames: boolean;
```

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`useCaseSensitiveFileNames`](ParseConfigHost.md#usecasesensitivefilenames)

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

[`ParseConfigHost`](ParseConfigHost.md).[`directoryExists`](ParseConfigHost.md#directoryexists)

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

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`fileExists`](ParseConfigHost.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5929

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Overrides

[`ParseConfigHost`](ParseConfigHost.md).[`getCurrentDirectory`](ParseConfigHost.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9191

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

[`ParseConfigHost`](ParseConfigHost.md).[`getDirectories`](ParseConfigHost.md#getdirectories)

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

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`readDirectory`](ParseConfigHost.md#readdirectory)

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

#### Inherited from

[`ParseConfigHost`](ParseConfigHost.md).[`readFile`](ParseConfigHost.md#readfile)

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

[`ParseConfigHost`](ParseConfigHost.md).[`realpath`](ParseConfigHost.md#realpath)

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

[`ParseConfigHost`](ParseConfigHost.md).[`trace`](ParseConfigHost.md#trace)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5931
