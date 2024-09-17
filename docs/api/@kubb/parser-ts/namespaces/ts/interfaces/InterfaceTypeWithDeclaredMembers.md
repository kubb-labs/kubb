[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / InterfaceTypeWithDeclaredMembers

# InterfaceTypeWithDeclaredMembers

Class and interface types (ObjectFlags.Class and ObjectFlags.Interface).

## Extends

- [`InterfaceType`](InterfaceType.md)

## Properties

### aliasSymbol?

```ts
optional aliasSymbol: Symbol;
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`aliasSymbol`](InterfaceType.md#aliassymbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6580

***

### aliasTypeArguments?

```ts
optional aliasTypeArguments: readonly Type[];
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`aliasTypeArguments`](InterfaceType.md#aliastypearguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6581

***

### declaredCallSignatures

```ts
declaredCallSignatures: Signature[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6666

***

### declaredConstructSignatures

```ts
declaredConstructSignatures: Signature[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6667

***

### declaredIndexInfos

```ts
declaredIndexInfos: IndexInfo[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6668

***

### declaredProperties

```ts
declaredProperties: Symbol[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6665

***

### flags

```ts
flags: TypeFlags;
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`flags`](InterfaceType.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6577

***

### localTypeParameters

```ts
localTypeParameters: undefined | TypeParameter[];
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`localTypeParameters`](InterfaceType.md#localtypeparameters)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6660

***

### objectFlags

```ts
objectFlags: ObjectFlags;
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`objectFlags`](InterfaceType.md#objectflags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6654

***

### outerTypeParameters

```ts
outerTypeParameters: undefined | TypeParameter[];
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`outerTypeParameters`](InterfaceType.md#outertypeparameters)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6659

***

### pattern?

```ts
optional pattern: DestructuringPattern;
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`pattern`](InterfaceType.md#pattern)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6579

***

### symbol

```ts
symbol: Symbol;
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`symbol`](InterfaceType.md#symbol)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6578

***

### thisType

```ts
thisType: undefined | TypeParameter;
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`thisType`](InterfaceType.md#thistype)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6661

***

### typeParameters

```ts
typeParameters: undefined | TypeParameter[];
```

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`typeParameters`](InterfaceType.md#typeparameters)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6658

## Methods

### getApparentProperties()

```ts
getApparentProperties(): Symbol[]
```

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getApparentProperties`](InterfaceType.md#getapparentproperties)

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

[`InterfaceType`](InterfaceType.md).[`getBaseTypes`](InterfaceType.md#getbasetypes)

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

[`InterfaceType`](InterfaceType.md).[`getCallSignatures`](InterfaceType.md#getcallsignatures)

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

[`InterfaceType`](InterfaceType.md).[`getConstraint`](InterfaceType.md#getconstraint)

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

[`InterfaceType`](InterfaceType.md).[`getConstructSignatures`](InterfaceType.md#getconstructsignatures)

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

[`InterfaceType`](InterfaceType.md).[`getDefault`](InterfaceType.md#getdefault)

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

[`InterfaceType`](InterfaceType.md).[`getFlags`](InterfaceType.md#getflags)

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

[`InterfaceType`](InterfaceType.md).[`getNonNullableType`](InterfaceType.md#getnonnullabletype)

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

[`InterfaceType`](InterfaceType.md).[`getNumberIndexType`](InterfaceType.md#getnumberindextype)

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

[`InterfaceType`](InterfaceType.md).[`getProperties`](InterfaceType.md#getproperties)

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

[`InterfaceType`](InterfaceType.md).[`getProperty`](InterfaceType.md#getproperty)

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

[`InterfaceType`](InterfaceType.md).[`getStringIndexType`](InterfaceType.md#getstringindextype)

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

[`InterfaceType`](InterfaceType.md).[`getSymbol`](InterfaceType.md#getsymbol)

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

[`InterfaceType`](InterfaceType.md).[`isClass`](InterfaceType.md#isclass)

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

[`InterfaceType`](InterfaceType.md).[`isClassOrInterface`](InterfaceType.md#isclassorinterface)

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

[`InterfaceType`](InterfaceType.md).[`isIndexType`](InterfaceType.md#isindextype)

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

[`InterfaceType`](InterfaceType.md).[`isIntersection`](InterfaceType.md#isintersection)

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

[`InterfaceType`](InterfaceType.md).[`isLiteral`](InterfaceType.md#isliteral)

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

[`InterfaceType`](InterfaceType.md).[`isNumberLiteral`](InterfaceType.md#isnumberliteral)

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

[`InterfaceType`](InterfaceType.md).[`isStringLiteral`](InterfaceType.md#isstringliteral)

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

[`InterfaceType`](InterfaceType.md).[`isTypeParameter`](InterfaceType.md#istypeparameter)

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

[`InterfaceType`](InterfaceType.md).[`isUnion`](InterfaceType.md#isunion)

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

[`InterfaceType`](InterfaceType.md).[`isUnionOrIntersection`](InterfaceType.md#isunionorintersection)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6599
