[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / EnumType

# EnumType

## Extends

- [`FreshableType`](FreshableType.md)

## Properties

### aliasSymbol?

```ts
optional aliasSymbol: Symbol;
```

#### Inherited from

[`FreshableType`](FreshableType.md).[`aliasSymbol`](FreshableType.md#aliassymbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6580

***

### aliasTypeArguments?

```ts
optional aliasTypeArguments: readonly Type[];
```

#### Inherited from

[`FreshableType`](FreshableType.md).[`aliasTypeArguments`](FreshableType.md#aliastypearguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6581

***

### flags

```ts
flags: TypeFlags;
```

#### Inherited from

[`FreshableType`](FreshableType.md).[`flags`](FreshableType.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6577

***

### freshType

```ts
freshType: FreshableType;
```

#### Inherited from

[`FreshableType`](FreshableType.md).[`freshType`](FreshableType.md#freshtype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6609

***

### pattern?

```ts
optional pattern: DestructuringPattern;
```

#### Inherited from

[`FreshableType`](FreshableType.md).[`pattern`](FreshableType.md#pattern)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6579

***

### regularType

```ts
regularType: FreshableType;
```

#### Inherited from

[`FreshableType`](FreshableType.md).[`regularType`](FreshableType.md#regulartype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6610

***

### symbol

```ts
symbol: Symbol;
```

#### Inherited from

[`FreshableType`](FreshableType.md).[`symbol`](FreshableType.md#symbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6578

## Methods

### getApparentProperties()

```ts
getApparentProperties(): Symbol[]
```

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`FreshableType`](FreshableType.md).[`getApparentProperties`](FreshableType.md#getapparentproperties)

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

[`FreshableType`](FreshableType.md).[`getBaseTypes`](FreshableType.md#getbasetypes)

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

[`FreshableType`](FreshableType.md).[`getCallSignatures`](FreshableType.md#getcallsignatures)

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

[`FreshableType`](FreshableType.md).[`getConstraint`](FreshableType.md#getconstraint)

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

[`FreshableType`](FreshableType.md).[`getConstructSignatures`](FreshableType.md#getconstructsignatures)

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

[`FreshableType`](FreshableType.md).[`getDefault`](FreshableType.md#getdefault)

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

[`FreshableType`](FreshableType.md).[`getFlags`](FreshableType.md#getflags)

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

[`FreshableType`](FreshableType.md).[`getNonNullableType`](FreshableType.md#getnonnullabletype)

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

[`FreshableType`](FreshableType.md).[`getNumberIndexType`](FreshableType.md#getnumberindextype)

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

[`FreshableType`](FreshableType.md).[`getProperties`](FreshableType.md#getproperties)

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

[`FreshableType`](FreshableType.md).[`getProperty`](FreshableType.md#getproperty)

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

[`FreshableType`](FreshableType.md).[`getStringIndexType`](FreshableType.md#getstringindextype)

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

[`FreshableType`](FreshableType.md).[`getSymbol`](FreshableType.md#getsymbol)

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

[`FreshableType`](FreshableType.md).[`isClass`](FreshableType.md#isclass)

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

[`FreshableType`](FreshableType.md).[`isClassOrInterface`](FreshableType.md#isclassorinterface)

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

[`FreshableType`](FreshableType.md).[`isIndexType`](FreshableType.md#isindextype)

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

[`FreshableType`](FreshableType.md).[`isIntersection`](FreshableType.md#isintersection)

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

[`FreshableType`](FreshableType.md).[`isLiteral`](FreshableType.md#isliteral)

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

[`FreshableType`](FreshableType.md).[`isNumberLiteral`](FreshableType.md#isnumberliteral)

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

[`FreshableType`](FreshableType.md).[`isStringLiteral`](FreshableType.md#isstringliteral)

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

[`FreshableType`](FreshableType.md).[`isTypeParameter`](FreshableType.md#istypeparameter)

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

[`FreshableType`](FreshableType.md).[`isUnion`](FreshableType.md#isunion)

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

[`FreshableType`](FreshableType.md).[`isUnionOrIntersection`](FreshableType.md#isunionorintersection)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6599
