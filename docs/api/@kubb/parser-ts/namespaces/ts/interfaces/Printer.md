[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Printer

# Printer

## Methods

### printBundle()

```ts
printBundle(bundle): string
```

Prints a bundle of source files as-is, without any emit transformations.

#### Parameters

• **bundle**: [`Bundle`](Bundle.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8031

***

### printFile()

```ts
printFile(sourceFile): string
```

Prints a source file as-is, without any emit transformations.

#### Parameters

• **sourceFile**: [`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8027

***

### printList()

```ts
printList<T>(
   format, 
   list, 
   sourceFile): string
```

Prints a list of nodes using the given format flags

#### Type Parameters

• **T** *extends* [`Node`](Node.md)

#### Parameters

• **format**: [`ListFormat`](../enumerations/ListFormat.md)

• **list**: [`NodeArray`](NodeArray.md)\<`T`\>

• **sourceFile**: [`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8023

***

### printNode()

```ts
printNode(
   hint, 
   node, 
   sourceFile): string
```

Print a node and its subtree as-is, without any emit transformations.

#### Parameters

• **hint**: [`EmitHint`](../enumerations/EmitHint.md)

A value indicating the purpose of a node. This is primarily used to
distinguish between an `Identifier` used in an expression position, versus an
`Identifier` used as an `IdentifierName` as part of a declaration. For most nodes you
should just pass `Unspecified`.

• **node**: [`Node`](Node.md)

The node to print. The node and its subtree are printed as-is, without any
emit transformations.

• **sourceFile**: [`SourceFile`](SourceFile.md)

A source file that provides context for the node. The source text of
the file is used to emit the original source content for literals and identifiers, while
the identifiers of the source file are used when generating unique names to avoid
collisions.

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8019
