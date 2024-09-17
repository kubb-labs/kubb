[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / IntersectionType

# IntersectionType

## Extends

- [`UnionOrIntersectionType`](UnionOrIntersectionType.md)

## Properties

### aliasSymbol?

```ts
optional aliasSymbol: Symbol;
```

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`aliasSymbol`](UnionOrIntersectionType.md#aliassymbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6580

***

### aliasTypeArguments?

```ts
optional aliasTypeArguments: readonly Type[];
```

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`aliasTypeArguments`](UnionOrIntersectionType.md#aliastypearguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6581

***

### flags

```ts
flags: TypeFlags;
```

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`flags`](UnionOrIntersectionType.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6577

***

### pattern?

```ts
optional pattern: DestructuringPattern;
```

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`pattern`](UnionOrIntersectionType.md#pattern)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6579

***

### symbol

```ts
symbol: Symbol;
```

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`symbol`](UnionOrIntersectionType.md#symbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6578

***

### types

```ts
types: Type[];
```

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`types`](UnionOrIntersectionType.md#types)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6721

## Methods

### getApparentProperties()

```ts
getApparentProperties(): Symbol[]
```

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getApparentProperties`](UnionOrIntersectionType.md#getapparentproperties)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6588

***

### getBaseTypes()

```ts
getBaseTypes(): undefined | BaseType[]
```

#### Returns

`undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getBaseTypes`](UnionOrIntersectionType.md#getbasetypes)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6593

***

### getCallSignatures()

```ts
getCallSignatures(): readonly Signature[]
```

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getCallSignatures`](UnionOrIntersectionType.md#getcallsignatures)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6589

***

### getConstraint()

```ts
getConstraint(): undefined | Type
```

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getConstraint`](UnionOrIntersectionType.md#getconstraint)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6595

***

### getConstructSignatures()

```ts
getConstructSignatures(): readonly Signature[]
```

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getConstructSignatures`](UnionOrIntersectionType.md#getconstructsignatures)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6590

***

### getDefault()

```ts
getDefault(): undefined | Type
```

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getDefault`](UnionOrIntersectionType.md#getdefault)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6596

***

### getFlags()

```ts
getFlags(): TypeFlags
```

#### Returns

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getFlags`](UnionOrIntersectionType.md#getflags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6584

***

### getNonNullableType()

```ts
getNonNullableType(): Type
```

#### Returns

[`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getNonNullableType`](UnionOrIntersectionType.md#getnonnullabletype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6594

***

### getNumberIndexType()

```ts
getNumberIndexType(): undefined | Type
```

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getNumberIndexType`](UnionOrIntersectionType.md#getnumberindextype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6592

***

### getProperties()

```ts
getProperties(): Symbol[]
```

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getProperties`](UnionOrIntersectionType.md#getproperties)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6586

***

### getProperty()

```ts
getProperty(propertyName): undefined | Symbol
```

#### Parameters

• **propertyName**: `string`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getProperty`](UnionOrIntersectionType.md#getproperty)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6587

***

### getStringIndexType()

```ts
getStringIndexType(): undefined | Type
```

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getStringIndexType`](UnionOrIntersectionType.md#getstringindextype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6591

***

### getSymbol()

```ts
getSymbol(): undefined | Symbol
```

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getSymbol`](UnionOrIntersectionType.md#getsymbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6585

***

### isClass()

```ts
isClass(): this is InterfaceType
```

#### Returns

`this is InterfaceType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isClass`](UnionOrIntersectionType.md#isclass)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6605

***

### isClassOrInterface()

```ts
isClassOrInterface(): this is InterfaceType
```

#### Returns

`this is InterfaceType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isClassOrInterface`](UnionOrIntersectionType.md#isclassorinterface)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6604

***

### isIndexType()

```ts
isIndexType(): this is IndexType
```

#### Returns

`this is IndexType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isIndexType`](UnionOrIntersectionType.md#isindextype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6606

***

### isIntersection()

```ts
isIntersection(): this is IntersectionType
```

#### Returns

`this is IntersectionType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isIntersection`](UnionOrIntersectionType.md#isintersection)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6598

***

### isLiteral()

```ts
isLiteral(): this is LiteralType
```

#### Returns

`this is LiteralType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isLiteral`](UnionOrIntersectionType.md#isliteral)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6600

***

### isNumberLiteral()

```ts
isNumberLiteral(): this is NumberLiteralType
```

#### Returns

`this is NumberLiteralType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isNumberLiteral`](UnionOrIntersectionType.md#isnumberliteral)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6602

***

### isStringLiteral()

```ts
isStringLiteral(): this is StringLiteralType
```

#### Returns

`this is StringLiteralType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isStringLiteral`](UnionOrIntersectionType.md#isstringliteral)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6601

***

### isTypeParameter()

```ts
isTypeParameter(): this is TypeParameter
```

#### Returns

`this is TypeParameter`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isTypeParameter`](UnionOrIntersectionType.md#istypeparameter)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6603

***

### isUnion()

```ts
isUnion(): this is UnionType
```

#### Returns

`this is UnionType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isUnion`](UnionOrIntersectionType.md#isunion)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6597

***

### isUnionOrIntersection()

```ts
isUnionOrIntersection(): this is UnionOrIntersectionType
```

#### Returns

`this is UnionOrIntersectionType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isUnionOrIntersection`](UnionOrIntersectionType.md#isunionorintersection)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6599
