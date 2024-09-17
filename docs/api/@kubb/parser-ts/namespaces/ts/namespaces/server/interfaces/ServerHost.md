[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / ServerHost

# ServerHost

## Extends

- [`System`](../../../interfaces/System.md)

## Properties

### args

```ts
args: string[];
```

#### Inherited from

[`System`](../../../interfaces/System.md).[`args`](../../../interfaces/System.md#args)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8352

***

### newLine

```ts
newLine: string;
```

#### Inherited from

[`System`](../../../interfaces/System.md).[`newLine`](../../../interfaces/System.md#newline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8353

***

### preferNonRecursiveWatch?

```ts
optional preferNonRecursiveWatch: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2666

***

### useCaseSensitiveFileNames

```ts
useCaseSensitiveFileNames: boolean;
```

#### Inherited from

[`System`](../../../interfaces/System.md).[`useCaseSensitiveFileNames`](../../../interfaces/System.md#usecasesensitivefilenames)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8354

## Methods

### base64decode()?

```ts
optional base64decode(input): string
```

#### Parameters

• **input**: `string`

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`base64decode`](../../../interfaces/System.md#base64decode)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8390

***

### base64encode()?

```ts
optional base64encode(input): string
```

#### Parameters

• **input**: `string`

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`base64encode`](../../../interfaces/System.md#base64encode)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8391

***

### clearImmediate()

```ts
clearImmediate(timeoutId): void
```

#### Parameters

• **timeoutId**: `any`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2670

***

### clearScreen()?

```ts
optional clearScreen(): void
```

#### Returns

`void`

#### Inherited from

[`System`](../../../interfaces/System.md).[`clearScreen`](../../../interfaces/System.md#clearscreen)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8389

***

### clearTimeout()

```ts
clearTimeout(timeoutId): void
```

#### Parameters

• **timeoutId**: `any`

#### Returns

`void`

#### Overrides

[`System`](../../../interfaces/System.md).[`clearTimeout`](../../../interfaces/System.md#cleartimeout)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2668

***

### createDirectory()

```ts
createDirectory(path): void
```

#### Parameters

• **path**: `string`

#### Returns

`void`

#### Inherited from

[`System`](../../../interfaces/System.md).[`createDirectory`](../../../interfaces/System.md#createdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8370

***

### createHash()?

```ts
optional createHash(data): string
```

A good implementation is node.js' `crypto.createHash`. (https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm)

#### Parameters

• **data**: `string`

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`createHash`](../../../interfaces/System.md#createhash)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8381

***

### createSHA256Hash()?

```ts
optional createSHA256Hash(data): string
```

This must be cryptographically secure. Only implement this method using `crypto.createHash("sha256")`.

#### Parameters

• **data**: `string`

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`createSHA256Hash`](../../../interfaces/System.md#createsha256hash)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8383

***

### deleteFile()?

```ts
optional deleteFile(path): void
```

#### Parameters

• **path**: `string`

#### Returns

`void`

#### Inherited from

[`System`](../../../interfaces/System.md).[`deleteFile`](../../../interfaces/System.md#deletefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8377

***

### directoryExists()

```ts
directoryExists(path): boolean
```

#### Parameters

• **path**: `string`

#### Returns

`boolean`

#### Inherited from

[`System`](../../../interfaces/System.md).[`directoryExists`](../../../interfaces/System.md#directoryexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8369

***

### exit()

```ts
exit(exitCode?): void
```

#### Parameters

• **exitCode?**: `number`

#### Returns

`void`

#### Inherited from

[`System`](../../../interfaces/System.md).[`exit`](../../../interfaces/System.md#exit)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8385

***

### fileExists()

```ts
fileExists(path): boolean
```

#### Parameters

• **path**: `string`

#### Returns

`boolean`

#### Inherited from

[`System`](../../../interfaces/System.md).[`fileExists`](../../../interfaces/System.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8368

***

### gc()?

```ts
optional gc(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2671

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`getCurrentDirectory`](../../../interfaces/System.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8372

***

### getDirectories()

```ts
getDirectories(path): string[]
```

#### Parameters

• **path**: `string`

#### Returns

`string`[]

#### Inherited from

[`System`](../../../interfaces/System.md).[`getDirectories`](../../../interfaces/System.md#getdirectories)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8373

***

### getExecutingFilePath()

```ts
getExecutingFilePath(): string
```

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`getExecutingFilePath`](../../../interfaces/System.md#getexecutingfilepath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8371

***

### getFileSize()?

```ts
optional getFileSize(path): number
```

#### Parameters

• **path**: `string`

#### Returns

`number`

#### Inherited from

[`System`](../../../interfaces/System.md).[`getFileSize`](../../../interfaces/System.md#getfilesize)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8359

***

### getMemoryUsage()?

```ts
optional getMemoryUsage(): number
```

#### Returns

`number`

#### Inherited from

[`System`](../../../interfaces/System.md).[`getMemoryUsage`](../../../interfaces/System.md#getmemoryusage)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8384

***

### getModifiedTime()?

```ts
optional getModifiedTime(path): undefined | Date
```

#### Parameters

• **path**: `string`

#### Returns

`undefined` \| `Date`

#### Inherited from

[`System`](../../../interfaces/System.md).[`getModifiedTime`](../../../interfaces/System.md#getmodifiedtime)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8375

***

### getWidthOfTerminal()?

```ts
optional getWidthOfTerminal(): number
```

#### Returns

`number`

#### Inherited from

[`System`](../../../interfaces/System.md).[`getWidthOfTerminal`](../../../interfaces/System.md#getwidthofterminal)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8357

***

### readDirectory()

```ts
readDirectory(
   path, 
   extensions?, 
   exclude?, 
   include?, 
   depth?): string[]
```

#### Parameters

• **path**: `string`

• **extensions?**: readonly `string`[]

• **exclude?**: readonly `string`[]

• **include?**: readonly `string`[]

• **depth?**: `number`

#### Returns

`string`[]

#### Inherited from

[`System`](../../../interfaces/System.md).[`readDirectory`](../../../interfaces/System.md#readdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8374

***

### readFile()

```ts
readFile(path, encoding?): undefined | string
```

#### Parameters

• **path**: `string`

• **encoding?**: `string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`readFile`](../../../interfaces/System.md#readfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8358

***

### realpath()?

```ts
optional realpath(path): string
```

#### Parameters

• **path**: `string`

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`realpath`](../../../interfaces/System.md#realpath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8386

***

### require()?

```ts
optional require(initialPath, moduleName): ModuleImportResult
```

#### Parameters

• **initialPath**: `string`

• **moduleName**: `string`

#### Returns

[`ModuleImportResult`](../type-aliases/ModuleImportResult.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2673

***

### resolvePath()

```ts
resolvePath(path): string
```

#### Parameters

• **path**: `string`

#### Returns

`string`

#### Inherited from

[`System`](../../../interfaces/System.md).[`resolvePath`](../../../interfaces/System.md#resolvepath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8367

***

### setImmediate()

```ts
setImmediate(callback, ...args): any
```

#### Parameters

• **callback**

• ...**args**: `any`[]

#### Returns

`any`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2669

***

### setModifiedTime()?

```ts
optional setModifiedTime(path, time): void
```

#### Parameters

• **path**: `string`

• **time**: `Date`

#### Returns

`void`

#### Inherited from

[`System`](../../../interfaces/System.md).[`setModifiedTime`](../../../interfaces/System.md#setmodifiedtime)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8376

***

### setTimeout()

```ts
setTimeout(
   callback, 
   ms, ...
   args): any
```

#### Parameters

• **callback**

• **ms**: `number`

• ...**args**: `any`[]

#### Returns

`any`

#### Overrides

[`System`](../../../interfaces/System.md).[`setTimeout`](../../../interfaces/System.md#settimeout)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2667

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2672

***

### watchDirectory()

```ts
watchDirectory(
   path, 
   callback, 
   recursive?, 
   options?): FileWatcher
```

#### Parameters

• **path**: `string`

• **callback**: [`DirectoryWatcherCallback`](../../../type-aliases/DirectoryWatcherCallback.md)

• **recursive?**: `boolean`

• **options?**: [`WatchOptions`](../../../interfaces/WatchOptions.md)

#### Returns

[`FileWatcher`](../../../interfaces/FileWatcher.md)

#### Overrides

[`System`](../../../interfaces/System.md).[`watchDirectory`](../../../interfaces/System.md#watchdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2665

***

### watchFile()

```ts
watchFile(
   path, 
   callback, 
   pollingInterval?, 
   options?): FileWatcher
```

#### Parameters

• **path**: `string`

• **callback**: [`FileWatcherCallback`](../../../type-aliases/FileWatcherCallback.md)

• **pollingInterval?**: `number`

• **options?**: [`WatchOptions`](../../../interfaces/WatchOptions.md)

#### Returns

[`FileWatcher`](../../../interfaces/FileWatcher.md)

#### Polling Interval

- this parameter is used in polling-based watchers and ignored in watchers that
use native OS file watching

#### Overrides

[`System`](../../../interfaces/System.md).[`watchFile`](../../../interfaces/System.md#watchfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2664

***

### write()

```ts
write(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Inherited from

[`System`](../../../interfaces/System.md).[`write`](../../../interfaces/System.md#write)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8355

***

### writeFile()

```ts
writeFile(
   path, 
   data, 
   writeByteOrderMark?): void
```

#### Parameters

• **path**: `string`

• **data**: `string`

• **writeByteOrderMark?**: `boolean`

#### Returns

`void`

#### Inherited from

[`System`](../../../interfaces/System.md).[`writeFile`](../../../interfaces/System.md#writefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8360

***

### writeOutputIsTTY()?

```ts
optional writeOutputIsTTY(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`System`](../../../interfaces/System.md).[`writeOutputIsTTY`](../../../interfaces/System.md#writeoutputistty)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8356
