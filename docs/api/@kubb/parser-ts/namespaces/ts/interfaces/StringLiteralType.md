[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / StringLiteralType

# StringLiteralType

## Extends

- [`LiteralType`](LiteralType.md)

## Properties

### aliasSymbol?

```ts
optional aliasSymbol: Symbol;
```

#### Inherited from

[`LiteralType`](LiteralType.md).[`aliasSymbol`](LiteralType.md#aliassymbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6580

***

### aliasTypeArguments?

```ts
optional aliasTypeArguments: readonly Type[];
```

#### Inherited from

[`LiteralType`](LiteralType.md).[`aliasTypeArguments`](LiteralType.md#aliastypearguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6581

***

### flags

```ts
flags: TypeFlags;
```

#### Inherited from

[`LiteralType`](LiteralType.md).[`flags`](LiteralType.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6577

***

### freshType

```ts
freshType: FreshableType;
```

#### Inherited from

[`LiteralType`](LiteralType.md).[`freshType`](LiteralType.md#freshtype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6609

***

### pattern?

```ts
optional pattern: DestructuringPattern;
```

#### Inherited from

[`LiteralType`](LiteralType.md).[`pattern`](LiteralType.md#pattern)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6579

***

### regularType

```ts
regularType: FreshableType;
```

#### Inherited from

[`LiteralType`](LiteralType.md).[`regularType`](LiteralType.md#regulartype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6610

***

### symbol

```ts
symbol: Symbol;
```

#### Inherited from

[`LiteralType`](LiteralType.md).[`symbol`](LiteralType.md#symbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6578

***

### value

```ts
value: string;
```

#### Overrides

[`LiteralType`](LiteralType.md).[`value`](LiteralType.md#value)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6620

## Methods

### getApparentProperties()

```ts
getApparentProperties(): Symbol[]
```

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`LiteralType`](LiteralType.md).[`getApparentProperties`](LiteralType.md#getapparentproperties)

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

[`LiteralType`](LiteralType.md).[`getBaseTypes`](LiteralType.md#getbasetypes)

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

[`LiteralType`](LiteralType.md).[`getCallSignatures`](LiteralType.md#getcallsignatures)

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

[`LiteralType`](LiteralType.md).[`getConstraint`](LiteralType.md#getconstraint)

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

[`LiteralType`](LiteralType.md).[`getConstructSignatures`](LiteralType.md#getconstructsignatures)

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

[`LiteralType`](LiteralType.md).[`getDefault`](LiteralType.md#getdefault)

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

[`LiteralType`](LiteralType.md).[`getFlags`](LiteralType.md#getflags)

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

[`LiteralType`](LiteralType.md).[`getNonNullableType`](LiteralType.md#getnonnullabletype)

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

[`LiteralType`](LiteralType.md).[`getNumberIndexType`](LiteralType.md#getnumberindextype)

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

[`LiteralType`](LiteralType.md).[`getProperties`](LiteralType.md#getproperties)

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

[`LiteralType`](LiteralType.md).[`getProperty`](LiteralType.md#getproperty)

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

[`LiteralType`](LiteralType.md).[`getStringIndexType`](LiteralType.md#getstringindextype)

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

[`LiteralType`](LiteralType.md).[`getSymbol`](LiteralType.md#getsymbol)

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

[`LiteralType`](LiteralType.md).[`isClass`](LiteralType.md#isclass)

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

[`LiteralType`](LiteralType.md).[`isClassOrInterface`](LiteralType.md#isclassorinterface)

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

[`LiteralType`](LiteralType.md).[`isIndexType`](LiteralType.md#isindextype)

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

[`LiteralType`](LiteralType.md).[`isIntersection`](LiteralType.md#isintersection)

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

[`LiteralType`](LiteralType.md).[`isLiteral`](LiteralType.md#isliteral)

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

[`LiteralType`](LiteralType.md).[`isNumberLiteral`](LiteralType.md#isnumberliteral)

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

[`LiteralType`](LiteralType.md).[`isStringLiteral`](LiteralType.md#isstringliteral)

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

[`LiteralType`](LiteralType.md).[`isTypeParameter`](LiteralType.md#istypeparameter)

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

[`LiteralType`](LiteralType.md).[`isUnion`](LiteralType.md#isunion)

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

[`LiteralType`](LiteralType.md).[`isUnionOrIntersection`](LiteralType.md#isunionorintersection)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6599
