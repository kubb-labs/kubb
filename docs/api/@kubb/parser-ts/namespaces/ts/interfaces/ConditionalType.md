[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ConditionalType

# ConditionalType

## Extends

- [`InstantiableType`](InstantiableType.md)

## Properties

### aliasSymbol?

```ts
optional aliasSymbol: Symbol;
```

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`aliasSymbol`](InstantiableType.md#aliassymbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6580

***

### aliasTypeArguments?

```ts
optional aliasTypeArguments: readonly Type[];
```

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`aliasTypeArguments`](InstantiableType.md#aliastypearguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6581

***

### checkType

```ts
checkType: Type;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6760

***

### extendsType

```ts
extendsType: Type;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6761

***

### flags

```ts
flags: TypeFlags;
```

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`flags`](InstantiableType.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6577

***

### pattern?

```ts
optional pattern: DestructuringPattern;
```

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`pattern`](InstantiableType.md#pattern)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6579

***

### resolvedFalseType?

```ts
optional resolvedFalseType: Type;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6763

***

### resolvedTrueType?

```ts
optional resolvedTrueType: Type;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6762

***

### root

```ts
root: ConditionalRoot;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6759

***

### symbol

```ts
symbol: Symbol;
```

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`symbol`](InstantiableType.md#symbol)

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

[`InstantiableType`](InstantiableType.md).[`getApparentProperties`](InstantiableType.md#getapparentproperties)

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

[`InstantiableType`](InstantiableType.md).[`getBaseTypes`](InstantiableType.md#getbasetypes)

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

[`InstantiableType`](InstantiableType.md).[`getCallSignatures`](InstantiableType.md#getcallsignatures)

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

[`InstantiableType`](InstantiableType.md).[`getConstraint`](InstantiableType.md#getconstraint)

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

[`InstantiableType`](InstantiableType.md).[`getConstructSignatures`](InstantiableType.md#getconstructsignatures)

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

[`InstantiableType`](InstantiableType.md).[`getDefault`](InstantiableType.md#getdefault)

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

[`InstantiableType`](InstantiableType.md).[`getFlags`](InstantiableType.md#getflags)

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

[`InstantiableType`](InstantiableType.md).[`getNonNullableType`](InstantiableType.md#getnonnullabletype)

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

[`InstantiableType`](InstantiableType.md).[`getNumberIndexType`](InstantiableType.md#getnumberindextype)

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

[`InstantiableType`](InstantiableType.md).[`getProperties`](InstantiableType.md#getproperties)

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

[`InstantiableType`](InstantiableType.md).[`getProperty`](InstantiableType.md#getproperty)

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

[`InstantiableType`](InstantiableType.md).[`getStringIndexType`](InstantiableType.md#getstringindextype)

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

[`InstantiableType`](InstantiableType.md).[`getSymbol`](InstantiableType.md#getsymbol)

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

[`InstantiableType`](InstantiableType.md).[`isClass`](InstantiableType.md#isclass)

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

[`InstantiableType`](InstantiableType.md).[`isClassOrInterface`](InstantiableType.md#isclassorinterface)

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

[`InstantiableType`](InstantiableType.md).[`isIndexType`](InstantiableType.md#isindextype)

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

[`InstantiableType`](InstantiableType.md).[`isIntersection`](InstantiableType.md#isintersection)

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

[`InstantiableType`](InstantiableType.md).[`isLiteral`](InstantiableType.md#isliteral)

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

[`InstantiableType`](InstantiableType.md).[`isNumberLiteral`](InstantiableType.md#isnumberliteral)

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

[`InstantiableType`](InstantiableType.md).[`isStringLiteral`](InstantiableType.md#isstringliteral)

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

[`InstantiableType`](InstantiableType.md).[`isTypeParameter`](InstantiableType.md#istypeparameter)

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

[`InstantiableType`](InstantiableType.md).[`isUnion`](InstantiableType.md#isunion)

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

[`InstantiableType`](InstantiableType.md).[`isUnionOrIntersection`](InstantiableType.md#isunionorintersection)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6599
