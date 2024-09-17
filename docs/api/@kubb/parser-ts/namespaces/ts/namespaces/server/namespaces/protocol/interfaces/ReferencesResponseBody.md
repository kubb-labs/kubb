[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ReferencesResponseBody

# ReferencesResponseBody

The body of a "references" response message.

## Properties

### refs

```ts
refs: readonly ReferencesResponseItem[];
```

The file locations referencing the symbol.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:914

***

### symbolDisplayString

```ts
symbolDisplayString: string;
```

The full display name of the symbol.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:926

***

### symbolName

```ts
symbolName: string;
```

The name of the symbol.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:918

***

### symbolStartOffset

```ts
symbolStartOffset: number;
```

The start character offset of the symbol (on the line provided by the references request).

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:922
