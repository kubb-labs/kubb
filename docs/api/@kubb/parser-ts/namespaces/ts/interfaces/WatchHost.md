[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / WatchHost

# WatchHost

Host that has watch functionality used in --watch mode

## Extended by

- [`WatchCompilerHost`](WatchCompilerHost.md)
- [`SolutionBuilderWithWatchHost`](SolutionBuilderWithWatchHost.md)

## Properties

### preferNonRecursiveWatch?

```ts
optional preferNonRecursiveWatch: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9703

## Methods

### clearTimeout()?

```ts
optional clearTimeout(timeoutId): void
```

If provided, will be used to reset existing delayed compilation

#### Parameters

• **timeoutId**: `any`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9702

***

### onWatchStatusChange()?

```ts
optional onWatchStatusChange(
   diagnostic, 
   newLine, 
   options, 
   errorCount?): void
```

If provided, called with Diagnostic message that informs about change in watch status

#### Parameters

• **diagnostic**: [`Diagnostic`](Diagnostic.md)

• **newLine**: `string`

• **options**: [`CompilerOptions`](CompilerOptions.md)

• **errorCount?**: `number`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9694

***

### setTimeout()?

```ts
optional setTimeout(
   callback, 
   ms, ...
   args): any
```

If provided, will be used to set delayed compilation, so that multiple changes in short span are compiled together

#### Parameters

• **callback**

• **ms**: `number`

• ...**args**: `any`[]

#### Returns

`any`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9700

***

### watchDirectory()

```ts
watchDirectory(
   path, 
   callback, 
   recursive?, 
   options?): FileWatcher
```

Used to watch resolved module's failed lookup locations, config file specs, type roots where auto type reference directives are added

#### Parameters

• **path**: `string`

• **callback**: [`DirectoryWatcherCallback`](../type-aliases/DirectoryWatcherCallback.md)

• **recursive?**: `boolean`

• **options?**: [`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9698

***

### watchFile()

```ts
watchFile(
   path, 
   callback, 
   pollingInterval?, 
   options?): FileWatcher
```

Used to watch changes in source files, missing files needed to update the program or config file

#### Parameters

• **path**: `string`

• **callback**: [`FileWatcherCallback`](../type-aliases/FileWatcherCallback.md)

• **pollingInterval?**: `number`

• **options?**: [`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9696
