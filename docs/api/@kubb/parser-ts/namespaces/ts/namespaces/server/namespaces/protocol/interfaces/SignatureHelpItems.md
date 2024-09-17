[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / SignatureHelpItems

# SignatureHelpItems

Signature help items found in the response of a signature help request.

## Properties

### applicableSpan

```ts
applicableSpan: TextSpan;
```

The span for which signature help should appear on a signature

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1709

***

### argumentCount

```ts
argumentCount: number;
```

The argument count

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1721

***

### argumentIndex

```ts
argumentIndex: number;
```

The argument selected in the set of parameters.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1717

***

### items

```ts
items: ChangePropertyTypes<SignatureHelpItem, object>[];
```

The signature help items.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1705

***

### selectedItemIndex

```ts
selectedItemIndex: number;
```

The item selected in the set of available help items.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1713
