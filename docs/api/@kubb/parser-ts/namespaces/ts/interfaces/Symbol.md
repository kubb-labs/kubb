[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Symbol

# Symbol

## Properties

### declarations?

```ts
optional declarations: Declaration[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6466

***

### escapedName

```ts
escapedName: __String;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6465

***

### exports?

```ts
optional exports: SymbolTable;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6469

***

### flags

```ts
flags: SymbolFlags;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6464

***

### globalExports?

```ts
optional globalExports: SymbolTable;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6470

***

### members?

```ts
optional members: SymbolTable;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6468

***

### name

```ts
readonly name: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6473

***

### valueDeclaration?

```ts
optional valueDeclaration: Declaration;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6467

## Methods

### getDeclarations()

```ts
getDeclarations(): undefined | Declaration[]
```

#### Returns

`undefined` \| [`Declaration`](Declaration.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6477

***

### getDocumentationComment()

```ts
getDocumentationComment(typeChecker): SymbolDisplayPart[]
```

#### Parameters

• **typeChecker**: `undefined` \| [`TypeChecker`](TypeChecker.md)

#### Returns

[`SymbolDisplayPart`](../namespaces/server/namespaces/protocol/interfaces/SymbolDisplayPart.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6478

***

### getEscapedName()

```ts
getEscapedName(): __String
```

#### Returns

[`__String`](../type-aliases/String.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6475

***

### getFlags()

```ts
getFlags(): SymbolFlags
```

#### Returns

[`SymbolFlags`](../enumerations/SymbolFlags.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6474

***

### getJsDocTags()

```ts
getJsDocTags(checker?): JSDocTagInfo[]
```

#### Parameters

• **checker?**: [`TypeChecker`](TypeChecker.md)

#### Returns

[`JSDocTagInfo`](JSDocTagInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6479

***

### getName()

```ts
getName(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6476
