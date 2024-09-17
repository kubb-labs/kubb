[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TypeChecker

# TypeChecker

## Properties

### getIndexInfosOfIndexSymbol()

```ts
getIndexInfosOfIndexSymbol: (indexSymbol) => IndexInfo[];
```

#### Parameters

• **indexSymbol**: [`Symbol`](Symbol.md)

#### Returns

[`IndexInfo`](IndexInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6118

## Methods

### getAliasedSymbol()

```ts
getAliasedSymbol(symbol): Symbol
```

Follow all aliases to get the original symbol.

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

[`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6215

***

### getAmbientModules()

```ts
getAmbientModules(): Symbol[]
```

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6221

***

### getAnyType()

```ts
getAnyType(): Type
```

Gets the intrinsic `any` type. There are multiple types that act as `any` used internally in the compiler,
so the type returned by this function should not be used in equality checks to determine if another type
is `any`. Instead, use `type.flags & TypeFlags.Any`.

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6231

***

### getApparentType()

```ts
getApparentType(type): Type
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6223

***

### getAugmentedPropertiesOfType()

```ts
getAugmentedPropertiesOfType(type): Symbol[]
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6196

***

### getAwaitedType()

```ts
getAwaitedType(type): undefined | Type
```

Gets the "awaited type" of a type.

If an expression has a Promise-like type, the "awaited type" of the expression is
derived from the type of the first argument of the fulfillment callback for that
Promise's `then` method. If the "awaited type" is itself a Promise-like, it is
recursively unwrapped in the same manner until a non-promise type is found.

If an expression does not have a Promise-like type, its "awaited type" is the type
of the expression.

If the resulting "awaited type" is a generic object type, then it is wrapped in
an `Awaited<T>`.

In the event the "awaited type" circularly references itself, or is a non-Promise
object-type with a callable `then()` method, an "awaited type" cannot be determined
and the value `undefined` will be returned.

This is used to reflect the runtime behavior of the `await` keyword.

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

`undefined` \| [`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6144

***

### getBaseConstraintOfType()

```ts
getBaseConstraintOfType(type): undefined | Type
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

`undefined` \| [`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6224

***

### getBaseTypeOfLiteralType()

```ts
getBaseTypeOfLiteralType(type): Type
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6122

***

### getBaseTypes()

```ts
getBaseTypes(type): BaseType[]
```

#### Parameters

• **type**: [`InterfaceType`](InterfaceType.md)

#### Returns

[`BaseType`](../type-aliases/BaseType.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6121

***

### getBigIntLiteralType()

```ts
getBigIntLiteralType(value): BigIntLiteralType
```

#### Parameters

• **value**: [`PseudoBigInt`](PseudoBigInt.md)

#### Returns

[`BigIntLiteralType`](BigIntLiteralType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6237

***

### getBigIntType()

```ts
getBigIntType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6236

***

### getBooleanType()

```ts
getBooleanType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6238

***

### getConstantValue()

```ts
getConstantValue(node): undefined | string | number
```

#### Parameters

• **node**: [`EnumMember`](EnumMember.md) \| [`ElementAccessExpression`](ElementAccessExpression.md) \| [`PropertyAccessExpression`](PropertyAccessExpression.md)

#### Returns

`undefined` \| `string` \| `number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6212

***

### getContextualType()

```ts
getContextualType(node): undefined | Type
```

#### Parameters

• **node**: [`Expression`](Expression.md)

#### Returns

`undefined` \| [`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6199

***

### getDeclaredTypeOfSymbol()

```ts
getDeclaredTypeOfSymbol(symbol): Type
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6112

***

### getDefaultFromTypeParameter()

```ts
getDefaultFromTypeParameter(type): undefined | Type
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

`undefined` \| [`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6225

***

### getESSymbolType()

```ts
getESSymbolType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6254

***

### getExportsOfModule()

```ts
getExportsOfModule(moduleSymbol): Symbol[]
```

#### Parameters

• **moduleSymbol**: [`Symbol`](Symbol.md)

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6218

***

### getExportSpecifierLocalTargetSymbol()

```ts
getExportSpecifierLocalTargetSymbol(location): undefined | Symbol
```

#### Parameters

• **location**: [`Identifier`](Identifier.md) \| [`ExportSpecifier`](ExportSpecifier.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6177

***

### getExportSymbolOfSymbol()

```ts
getExportSymbolOfSymbol(symbol): Symbol
```

If a symbol is a local symbol with an associated exported symbol, returns the exported symbol.
Otherwise returns its input.
For example, at `export type T = number;`:
    - `getSymbolAtLocation` at the location `T` will return the exported symbol for `T`.
    - But the result of `getSymbolsInScope` will contain the *local* symbol for `T`, not the exported symbol.
    - Calling `getExportSymbolOfSymbol` on that local symbol will return the exported symbol.

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

[`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6186

***

### getFalseType()

```ts
getFalseType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6239

***

### getFullyQualifiedName()

```ts
getFullyQualifiedName(symbol): string
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6195

***

### getImmediateAliasedSymbol()

```ts
getImmediateAliasedSymbol(symbol): undefined | Symbol
```

Follow a *single* alias to get the immediately aliased symbol.

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6217

***

### getIndexInfoOfType()

```ts
getIndexInfoOfType(type, kind): undefined | IndexInfo
```

#### Parameters

• **type**: [`Type`](Type.md)

• **kind**: [`IndexKind`](../enumerations/IndexKind.md)

#### Returns

`undefined` \| [`IndexInfo`](IndexInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6116

***

### getIndexInfosOfType()

```ts
getIndexInfosOfType(type): readonly IndexInfo[]
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

readonly [`IndexInfo`](IndexInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6117

***

### getIndexTypeOfType()

```ts
getIndexTypeOfType(type, kind): undefined | Type
```

#### Parameters

• **type**: [`Type`](Type.md)

• **kind**: [`IndexKind`](../enumerations/IndexKind.md)

#### Returns

`undefined` \| [`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6120

***

### getJsxIntrinsicTagNamesAt()

```ts
getJsxIntrinsicTagNamesAt(location): Symbol[]
```

#### Parameters

• **location**: [`Node`](Node.md)

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6219

***

### getMergedSymbol()

```ts
getMergedSymbol(symbol): Symbol
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

[`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6211

***

### getNeverType()

```ts
getNeverType(): Type
```

Gets the intrinsic `never` type. There are multiple types that act as `never` used internally in the compiler,
so the type returned by this function should not be used in equality checks to determine if another type
is `never`. Instead, use `type.flags & TypeFlags.Never`.

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6260

***

### getNonNullableType()

```ts
getNonNullableType(type): Type
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6147

***

### getNullableType()

```ts
getNullableType(type, flags): Type
```

#### Parameters

• **type**: [`Type`](Type.md)

• **flags**: [`TypeFlags`](../enumerations/TypeFlags.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6146

***

### getNullType()

```ts
getNullType(): Type
```

Gets the intrinsic `null` type. There are multiple types that act as `null` used internally in the compiler,
so the type returned by this function should not be used in equality checks to determine if another type
is `null`. Instead, use `type.flags & TypeFlags.Null`.

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6253

***

### getNumberLiteralType()

```ts
getNumberLiteralType(value): NumberLiteralType
```

#### Parameters

• **value**: `number`

#### Returns

[`NumberLiteralType`](NumberLiteralType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6235

***

### getNumberType()

```ts
getNumberType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6234

***

### getPrivateIdentifierPropertyOfType()

```ts
getPrivateIdentifierPropertyOfType(
   leftType, 
   name, 
   location): undefined | Symbol
```

#### Parameters

• **leftType**: [`Type`](Type.md)

• **name**: `string`

• **location**: [`Node`](Node.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6115

***

### getPropertiesOfType()

```ts
getPropertiesOfType(type): Symbol[]
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6113

***

### getPropertyOfType()

```ts
getPropertyOfType(type, propertyName): undefined | Symbol
```

#### Parameters

• **type**: [`Type`](Type.md)

• **propertyName**: `string`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6114

***

### getPropertySymbolOfDestructuringAssignment()

```ts
getPropertySymbolOfDestructuringAssignment(location): undefined | Symbol
```

#### Parameters

• **location**: [`Identifier`](Identifier.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6187

***

### getResolvedSignature()

```ts
getResolvedSignature(
   node, 
   candidatesOutArray?, 
   argumentCount?): undefined | Signature
```

returns unknownSignature in the case of an error.
returns undefined if the node is not valid.

#### Parameters

• **node**: [`CallLikeExpression`](../type-aliases/CallLikeExpression.md)

• **candidatesOutArray?**: [`Signature`](Signature.md)[]

• **argumentCount?**: `number`

Apparent number of arguments, passed in case of a possibly incomplete call. This should come from an ArgumentListInfo. See `signatureHelp.ts`.

#### Returns

`undefined` \| [`Signature`](Signature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6205

***

### getReturnTypeOfSignature()

```ts
getReturnTypeOfSignature(signature): Type
```

#### Parameters

• **signature**: [`Signature`](Signature.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6145

***

### getRootSymbols()

```ts
getRootSymbols(symbol): readonly Symbol[]
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

readonly [`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6197

***

### getShorthandAssignmentValueSymbol()

```ts
getShorthandAssignmentValueSymbol(location): undefined | Symbol
```

The function returns the value (local variable) symbol of an identifier in the short-hand property assignment.
This is necessary as an identifier in short-hand property assignment can contains two meaning: property name and property value.

#### Parameters

• **location**: `undefined` \| [`Node`](Node.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6176

***

### getSignatureFromDeclaration()

```ts
getSignatureFromDeclaration(declaration): undefined | Signature
```

#### Parameters

• **declaration**: [`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md)

#### Returns

`undefined` \| [`Signature`](Signature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6206

***

### getSignaturesOfType()

```ts
getSignaturesOfType(type, kind): readonly Signature[]
```

#### Parameters

• **type**: [`Type`](Type.md)

• **kind**: [`SignatureKind`](../enumerations/SignatureKind.md)

#### Returns

readonly [`Signature`](Signature.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6119

***

### getStringLiteralType()

```ts
getStringLiteralType(value): StringLiteralType
```

#### Parameters

• **value**: `string`

#### Returns

[`StringLiteralType`](StringLiteralType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6233

***

### getStringType()

```ts
getStringType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6232

***

### getSymbolAtLocation()

```ts
getSymbolAtLocation(node): undefined | Symbol
```

#### Parameters

• **node**: [`Node`](Node.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6170

***

### getSymbolOfExpando()

```ts
getSymbolOfExpando(node, allowDeclaration): undefined | Symbol
```

#### Parameters

• **node**: [`Node`](Node.md)

• **allowDeclaration**: `boolean`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6198

***

### getSymbolsInScope()

```ts
getSymbolsInScope(location, meaning): Symbol[]
```

#### Parameters

• **location**: [`Node`](Node.md)

• **meaning**: [`SymbolFlags`](../enumerations/SymbolFlags.md)

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6169

***

### getSymbolsOfParameterPropertyDeclaration()

```ts
getSymbolsOfParameterPropertyDeclaration(parameter, parameterName): Symbol[]
```

#### Parameters

• **parameter**: [`ParameterDeclaration`](ParameterDeclaration.md)

• **parameterName**: `string`

#### Returns

[`Symbol`](Symbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6171

***

### getTrueType()

```ts
getTrueType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6240

***

### getTypeArguments()

```ts
getTypeArguments(type): readonly Type[]
```

#### Parameters

• **type**: [`TypeReference`](TypeReference.md)

#### Returns

readonly [`Type`](Type.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6148

***

### getTypeAtLocation()

```ts
getTypeAtLocation(node): Type
```

#### Parameters

• **node**: [`Node`](Node.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6189

***

### getTypeFromTypeNode()

```ts
getTypeFromTypeNode(node): Type
```

#### Parameters

• **node**: [`TypeNode`](TypeNode.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6190

***

### getTypeOfAssignmentPattern()

```ts
getTypeOfAssignmentPattern(pattern): Type
```

#### Parameters

• **pattern**: [`AssignmentPattern`](../type-aliases/AssignmentPattern.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6188

***

### getTypeOfSymbol()

```ts
getTypeOfSymbol(symbol): Type
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6111

***

### getTypeOfSymbolAtLocation()

```ts
getTypeOfSymbolAtLocation(symbol, node): Type
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

• **node**: [`Node`](Node.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6110

***

### getTypePredicateOfSignature()

```ts
getTypePredicateOfSignature(signature): undefined | TypePredicate
```

#### Parameters

• **signature**: [`Signature`](Signature.md)

#### Returns

`undefined` \| [`TypePredicate`](../type-aliases/TypePredicate.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6291

***

### getUndefinedType()

```ts
getUndefinedType(): Type
```

Gets the intrinsic `undefined` type. There are multiple types that act as `undefined` used internally in the compiler
depending on compiler options, so the type returned by this function should not be used in equality checks to determine
if another type is `undefined`. Instead, use `type.flags & TypeFlags.Undefined`.

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6247

***

### getVoidType()

```ts
getVoidType(): Type
```

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6241

***

### getWidenedType()

```ts
getWidenedType(type): Type
```

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

[`Type`](Type.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6123

***

### indexInfoToIndexSignatureDeclaration()

```ts
indexInfoToIndexSignatureDeclaration(
   indexInfo, 
   enclosingDeclaration, 
   flags): undefined | IndexSignatureDeclaration
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **indexInfo**: [`IndexInfo`](IndexInfo.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6158

***

### isArgumentsSymbol()

```ts
isArgumentsSymbol(symbol): boolean
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6209

***

### isArrayLikeType()

```ts
isArrayLikeType(type): boolean
```

True if this type is assignable to `ReadonlyArray<any>`.

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6289

***

### isArrayType()

```ts
isArrayType(type): boolean
```

True if this type is the `Array` or `ReadonlyArray` type from lib.d.ts.
This function will _not_ return true if passed a type which
extends `Array` (for example, the TypeScript AST's `NodeArray` type).

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6280

***

### isImplementationOfOverload()

```ts
isImplementationOfOverload(node): undefined | boolean
```

#### Parameters

• **node**: [`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md)

#### Returns

`undefined` \| `boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6207

***

### isOptionalParameter()

```ts
isOptionalParameter(node): boolean
```

#### Parameters

• **node**: [`ParameterDeclaration`](ParameterDeclaration.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6220

***

### isTupleType()

```ts
isTupleType(type): boolean
```

True if this type is a tuple type. This function will _not_ return true if
passed a type which extends from a tuple.

#### Parameters

• **type**: [`Type`](Type.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6285

***

### isTypeAssignableTo()

```ts
isTypeAssignableTo(source, target): boolean
```

Returns true if the "source" type is assignable to the "target" type.

```ts
declare const abcLiteral: ts.Type; // Type of "abc"
declare const stringType: ts.Type; // Type of string

isTypeAssignableTo(abcLiteral, abcLiteral); // true; "abc" is assignable to "abc"
isTypeAssignableTo(abcLiteral, stringType); // true; "abc" is assignable to string
isTypeAssignableTo(stringType, abcLiteral); // false; string is not assignable to "abc"
isTypeAssignableTo(stringType, stringType); // true; string is assignable to string
```

#### Parameters

• **source**: [`Type`](Type.md)

• **target**: [`Type`](Type.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6274

***

### isUndefinedSymbol()

```ts
isUndefinedSymbol(symbol): boolean
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6208

***

### isUnknownSymbol()

```ts
isUnknownSymbol(symbol): boolean
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6210

***

### isValidPropertyAccess()

```ts
isValidPropertyAccess(node, propertyName): boolean
```

#### Parameters

• **node**: [`QualifiedName`](QualifiedName.md) \| [`PropertyAccessExpression`](PropertyAccessExpression.md) \| [`ImportTypeNode`](ImportTypeNode.md)

• **propertyName**: `string`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6213

***

### resolveName()

```ts
resolveName(
   name, 
   location, 
   meaning, 
   excludeGlobals): undefined | Symbol
```

#### Parameters

• **name**: `string`

• **location**: `undefined` \| [`Node`](Node.md)

• **meaning**: [`SymbolFlags`](../enumerations/SymbolFlags.md)

• **excludeGlobals**: `boolean`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6290

***

### runWithCancellationToken()

```ts
runWithCancellationToken<T>(token, cb): T
```

Depending on the operation performed, it may be appropriate to throw away the checker
if the cancellation token is triggered. Typically, if it is used for error checking
and the operation is cancelled, then it should be discarded, otherwise it is safe to keep.

#### Type Parameters

• **T**

#### Parameters

• **token**: [`CancellationToken`](CancellationToken.md)

• **cb**

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6297

***

### signatureToSignatureDeclaration()

```ts
signatureToSignatureDeclaration(
   signature, 
   kind, 
   enclosingDeclaration, 
flags): undefined | SignatureDeclaration & { typeArguments?: NodeArray<TypeNode> | undefined; }
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **signature**: [`Signature`](Signature.md)

• **kind**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| SignatureDeclaration & \{ typeArguments?: NodeArray\<TypeNode\> \| undefined; \}

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6152

***

### signatureToString()

```ts
signatureToString(
   signature, 
   enclosingDeclaration?, 
   flags?, 
   kind?): string
```

#### Parameters

• **signature**: [`Signature`](Signature.md)

• **enclosingDeclaration?**: [`Node`](Node.md)

• **flags?**: [`TypeFormatFlags`](../enumerations/TypeFormatFlags.md)

• **kind?**: [`SignatureKind`](../enumerations/SignatureKind.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6191

***

### symbolToEntityName()

```ts
symbolToEntityName(
   symbol, 
   meaning, 
   enclosingDeclaration, 
   flags): undefined | EntityName
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

• **meaning**: [`SymbolFlags`](../enumerations/SymbolFlags.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`EntityName`](../type-aliases/EntityName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6160

***

### symbolToExpression()

```ts
symbolToExpression(
   symbol, 
   meaning, 
   enclosingDeclaration, 
   flags): undefined | Expression
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

• **meaning**: [`SymbolFlags`](../enumerations/SymbolFlags.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`Expression`](Expression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6162

***

### symbolToParameterDeclaration()

```ts
symbolToParameterDeclaration(
   symbol, 
   enclosingDeclaration, 
   flags): undefined | ParameterDeclaration
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`ParameterDeclaration`](ParameterDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6166

***

### symbolToString()

```ts
symbolToString(
   symbol, 
   enclosingDeclaration?, 
   meaning?, 
   flags?): string
```

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

• **enclosingDeclaration?**: [`Node`](Node.md)

• **meaning?**: [`SymbolFlags`](../enumerations/SymbolFlags.md)

• **flags?**: [`SymbolFormatFlags`](../enumerations/SymbolFormatFlags.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6193

***

### symbolToTypeParameterDeclarations()

```ts
symbolToTypeParameterDeclarations(
   symbol, 
   enclosingDeclaration, 
flags): undefined | NodeArray<TypeParameterDeclaration>
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **symbol**: [`Symbol`](Symbol.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6164

***

### tryGetMemberInModuleExports()

```ts
tryGetMemberInModuleExports(memberName, moduleSymbol): undefined | Symbol
```

#### Parameters

• **memberName**: `string`

• **moduleSymbol**: [`Symbol`](Symbol.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6222

***

### typeParameterToDeclaration()

```ts
typeParameterToDeclaration(
   parameter, 
   enclosingDeclaration, 
   flags): undefined | TypeParameterDeclaration
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **parameter**: [`TypeParameter`](TypeParameter.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6168

***

### typePredicateToString()

```ts
typePredicateToString(
   predicate, 
   enclosingDeclaration?, 
   flags?): string
```

#### Parameters

• **predicate**: [`TypePredicate`](../type-aliases/TypePredicate.md)

• **enclosingDeclaration?**: [`Node`](Node.md)

• **flags?**: [`TypeFormatFlags`](../enumerations/TypeFormatFlags.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6194

***

### typeToString()

```ts
typeToString(
   type, 
   enclosingDeclaration?, 
   flags?): string
```

#### Parameters

• **type**: [`Type`](Type.md)

• **enclosingDeclaration?**: [`Node`](Node.md)

• **flags?**: [`TypeFormatFlags`](../enumerations/TypeFormatFlags.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6192

***

### typeToTypeNode()

```ts
typeToTypeNode(
   type, 
   enclosingDeclaration, 
   flags): undefined | TypeNode
```

Note that the resulting nodes cannot be checked.

#### Parameters

• **type**: [`Type`](Type.md)

• **enclosingDeclaration**: `undefined` \| [`Node`](Node.md)

• **flags**: `undefined` \| [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`TypeNode`](TypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6150
