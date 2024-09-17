[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / InstallTypingHost

# InstallTypingHost

## Extends

- [`TypingResolutionHost`](../../JsTyping/interfaces/TypingResolutionHost.md)

## Properties

### useCaseSensitiveFileNames

```ts
useCaseSensitiveFileNames: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2629

## Methods

### createDirectory()

```ts
createDirectory(path): void
```

#### Parameters

• **path**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2631

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

[`TypingResolutionHost`](../../JsTyping/interfaces/TypingResolutionHost.md).[`directoryExists`](../../JsTyping/interfaces/TypingResolutionHost.md#directoryexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3592

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

[`TypingResolutionHost`](../../JsTyping/interfaces/TypingResolutionHost.md).[`fileExists`](../../JsTyping/interfaces/TypingResolutionHost.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3593

***

### getCurrentDirectory()?

```ts
optional getCurrentDirectory(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2632

***

### readDirectory()

```ts
readDirectory(
   rootDir, 
   extensions, 
   excludes, 
   includes, 
   depth?): string[]
```

#### Parameters

• **rootDir**: `string`

• **extensions**: readonly `string`[]

• **excludes**: `undefined` \| readonly `string`[]

• **includes**: `undefined` \| readonly `string`[]

• **depth?**: `number`

#### Returns

`string`[]

#### Inherited from

[`TypingResolutionHost`](../../JsTyping/interfaces/TypingResolutionHost.md).[`readDirectory`](../../JsTyping/interfaces/TypingResolutionHost.md#readdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3595

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

[`TypingResolutionHost`](../../JsTyping/interfaces/TypingResolutionHost.md).[`readFile`](../../JsTyping/interfaces/TypingResolutionHost.md#readfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3594

***

### writeFile()

```ts
writeFile(path, content): void
```

#### Parameters

• **path**: `string`

• **content**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2630
