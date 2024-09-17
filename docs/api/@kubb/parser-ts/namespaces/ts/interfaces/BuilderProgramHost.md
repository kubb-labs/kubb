[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / BuilderProgramHost

# BuilderProgramHost

## Properties

### createHash()?

```ts
optional createHash: (data) => string;
```

If provided this would be used this hash instead of actual file shape text for detecting changes

#### Parameters

• **data**: `string`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9560

***

### writeFile?

```ts
optional writeFile: WriteFileCallback;
```

When emit or emitNextAffectedFile are called without writeFile,
this callback if present would be used to write files

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9565
