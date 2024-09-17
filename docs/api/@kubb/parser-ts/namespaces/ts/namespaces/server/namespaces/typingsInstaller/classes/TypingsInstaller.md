[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [typingsInstaller](../index.md) / TypingsInstaller

# `abstract` TypingsInstaller

## Constructors

### new TypingsInstaller()

```ts
new TypingsInstaller(
   installTypingHost, 
   globalCachePath, 
   safeListPath, 
   typesMapLocation, 
   throttleLimit, 
   log?): TypingsInstaller
```

#### Parameters

• **installTypingHost**: [`InstallTypingHost`](../../../interfaces/InstallTypingHost.md)

• **globalCachePath**: `string`

• **safeListPath**: [`Path`](../../../../../type-aliases/Path.md)

• **typesMapLocation**: [`Path`](../../../../../type-aliases/Path.md)

• **throttleLimit**: `number`

• **log?**: [`Log`](../interfaces/Log.md)

#### Returns

[`TypingsInstaller`](TypingsInstaller.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2543

## Properties

### installTypingHost

```ts
protected readonly installTypingHost: InstallTypingHost;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2528

***

### latestDistTag

```ts
protected readonly latestDistTag: "latest" = "latest";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2559

***

### log

```ts
protected readonly log: Log;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2533

***

### typesRegistry

```ts
abstract readonly typesRegistry: Map<string, MapLike<string>>;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2542

## Methods

### closeProject()

```ts
closeProject(req): void
```

#### Parameters

• **req**: [`CloseProject`](../../../interfaces/CloseProject.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2544

***

### ensurePackageDirectoryExists()

```ts
protected ensurePackageDirectoryExists(directory): void
```

#### Parameters

• **directory**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2550

***

### install()

```ts
install(req): void
```

#### Parameters

• **req**: [`DiscoverTypings`](../../../interfaces/DiscoverTypings.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2546

***

### installWorker()

```ts
abstract protected installWorker(
   requestId, 
   packageNames, 
   cwd, 
   onRequestCompleted): void
```

#### Parameters

• **requestId**: `number`

• **packageNames**: `string`[]

• **cwd**: `string`

• **onRequestCompleted**: [`RequestCompletedAction`](../type-aliases/RequestCompletedAction.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2557

***

### sendResponse()

```ts
abstract protected sendResponse(response): void
```

#### Parameters

• **response**: 
  \| [`SetTypings`](../../../interfaces/SetTypings.md)
  \| [`InvalidateCachedTypings`](../../../interfaces/InvalidateCachedTypings.md)
  \| [`BeginInstallTypes`](../../../interfaces/BeginInstallTypes.md)
  \| [`EndInstallTypes`](../../../interfaces/EndInstallTypes.md)
  \| [`WatchTypingLocations`](../../../interfaces/WatchTypingLocations.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2558
