[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Signature

# Signature

## Properties

### declaration?

```ts
optional declaration: SignatureDeclaration | JSDocSignature;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6783

***

### parameters

```ts
parameters: readonly Symbol[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6785

***

### thisParameter?

```ts
optional thisParameter: Symbol;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6786

***

### typeParameters?

```ts
optional typeParameters: readonly TypeParameter[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6784

## Methods

### getDeclaration()

```ts
getDeclaration(): SignatureDeclaration
```

#### Returns

[`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6789

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6794

***

### getJsDocTags()

```ts
getJsDocTags(): JSDocTagInfo[]
```

#### Returns

[`JSDocTagInfo`](JSDocTagInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6795

***

### getParameters()

```ts
getParameters(): Symbol[]
```

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6791

***

### getReturnType()

```ts
getReturnType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6793

***

### getTypeParameterAtPosition()

```ts
getTypeParameterAtPosition(pos): Type
```

#### Parameters

• **pos**: `number`

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6792

***

### getTypeParameters()

```ts
getTypeParameters(): undefined | TypeParameter[]
```

#### Returns

`undefined` \| [`TypeParameter`](TypeParameter.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6790
