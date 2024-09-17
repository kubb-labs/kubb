[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / System

# System

## Extended by

- [`ServerHost`](../namespaces/server/interfaces/ServerHost.md)

## Properties

### args

```ts
args: string[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8352

***

### newLine

```ts
newLine: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8353

***

### useCaseSensitiveFileNames

```ts
useCaseSensitiveFileNames: boolean;
```

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8391

***

### clearScreen()?

```ts
optional clearScreen(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8389

***

### clearTimeout()?

```ts
optional clearTimeout(timeoutId): void
```

#### Parameters

• **timeoutId**: `any`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8388

***

### createDirectory()

```ts
createDirectory(path): void
```

#### Parameters

• **path**: `string`

#### Returns

`void`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8368

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8373

***

### getExecutingFilePath()

```ts
getExecutingFilePath(): string
```

#### Returns

`string`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8359

***

### getMemoryUsage()?

```ts
optional getMemoryUsage(): number
```

#### Returns

`number`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8375

***

### getWidthOfTerminal()?

```ts
optional getWidthOfTerminal(): number
```

#### Returns

`number`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8386

***

### resolvePath()

```ts
resolvePath(path): string
```

#### Parameters

• **path**: `string`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8367

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8376

***

### setTimeout()?

```ts
optional setTimeout(
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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8387

***

### watchDirectory()?

```ts
optional watchDirectory(
   path, 
   callback, 
   recursive?, 
   options?): FileWatcher
```

#### Parameters

• **path**: `string`

• **callback**: [`DirectoryWatcherCallback`](../type-aliases/DirectoryWatcherCallback.md)

• **recursive?**: `boolean`

• **options?**: [`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8366

***

### watchFile()?

```ts
optional watchFile(
   path, 
   callback, 
   pollingInterval?, 
   options?): FileWatcher
```

#### Parameters

• **path**: `string`

• **callback**: [`FileWatcherCallback`](../type-aliases/FileWatcherCallback.md)

• **pollingInterval?**: `number`

• **options?**: [`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Polling Interval

- this parameter is used in polling-based watchers and ignored in watchers that
use native OS file watching

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8365

***

### write()

```ts
write(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8360

***

### writeOutputIsTTY()?

```ts
optional writeOutputIsTTY(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8356
