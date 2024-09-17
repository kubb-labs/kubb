[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [JsTyping](../index.md) / TypingResolutionHost

# TypingResolutionHost

## Extended by

- [`InstallTypingHost`](../../server/interfaces/InstallTypingHost.md)

## Methods

### directoryExists()

```ts
directoryExists(path): boolean
```

#### Parameters

• **path**: `string`

#### Returns

`boolean`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3593

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3594
