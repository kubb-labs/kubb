[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / FunctionLikeDeclarationBase

# FunctionLikeDeclarationBase

Several node kinds share function-like features such as a signature,
a name, and a body. These nodes should extend FunctionLikeDeclarationBase.
Examples:
- FunctionDeclaration
- MethodDeclaration
- AccessorDeclaration

## Extends

- [`SignatureDeclarationBase`](SignatureDeclarationBase.md)

## Extended by

- [`FunctionDeclaration`](FunctionDeclaration.md)
- [`MethodDeclaration`](MethodDeclaration.md)
- [`ConstructorDeclaration`](ConstructorDeclaration.md)
- [`GetAccessorDeclaration`](GetAccessorDeclaration.md)
- [`SetAccessorDeclaration`](SetAccessorDeclaration.md)
- [`FunctionExpression`](FunctionExpression.md)
- [`ArrowFunction`](ArrowFunction.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`_declarationBrand`](SignatureDeclarationBase.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### \_functionLikeDeclarationBrand

```ts
_functionLikeDeclarationBrand: any;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4580

***

### \_jsdocContainerBrand

```ts
_jsdocContainerBrand: any;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`_jsdocContainerBrand`](SignatureDeclarationBase.md#jsdoccontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4270

***

### asteriskToken?

```ts
readonly optional asteriskToken: AsteriskToken;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4581

***

### body?

```ts
readonly optional body: Expression | Block;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4584

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`end`](SignatureDeclarationBase.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### exclamationToken?

```ts
readonly optional exclamationToken: ExclamationToken;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4583

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`flags`](SignatureDeclarationBase.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: 
  | MethodSignature
  | MethodDeclaration
  | Constructor
  | GetAccessor
  | SetAccessor
  | CallSignature
  | ConstructSignature
  | IndexSignature
  | FunctionType
  | ConstructorType
  | FunctionExpression
  | ArrowFunction
  | FunctionDeclaration
  | JSDocFunctionType;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`kind`](SignatureDeclarationBase.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4468

***

### name?

```ts
readonly optional name: PropertyName;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`name`](SignatureDeclarationBase.md#name)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4469

***

### parameters

```ts
readonly parameters: NodeArray<ParameterDeclaration>;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`parameters`](SignatureDeclarationBase.md#parameters)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4471

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`parent`](SignatureDeclarationBase.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`pos`](SignatureDeclarationBase.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### questionToken?

```ts
readonly optional questionToken: QuestionToken;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4582

***

### type?

```ts
readonly optional type: TypeNode;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`type`](SignatureDeclarationBase.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4472

***

### typeParameters?

```ts
readonly optional typeParameters: NodeArray<TypeParameterDeclaration>;
```

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`typeParameters`](SignatureDeclarationBase.md#typeparameters)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4470

## Methods

### forEachChild()

```ts
forEachChild<T>(cbNode, cbNodeArray?): undefined | T
```

#### Type Parameters

• **T**

#### Parameters

• **cbNode**

• **cbNodeArray?**

#### Returns

`undefined` \| `T`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`forEachChild`](SignatureDeclarationBase.md#foreachchild)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4267

***

### getChildAt()

```ts
getChildAt(index, sourceFile?): Node
```

#### Parameters

• **index**: `number`

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

[`Node`](Node.md)

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getChildAt`](SignatureDeclarationBase.md#getchildat)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4255

***

### getChildCount()

```ts
getChildCount(sourceFile?): number
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getChildCount`](SignatureDeclarationBase.md#getchildcount)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4254

***

### getChildren()

```ts
getChildren(sourceFile?): readonly Node[]
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

readonly [`Node`](Node.md)[]

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getChildren`](SignatureDeclarationBase.md#getchildren)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4256

***

### getEnd()

```ts
getEnd(): number
```

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getEnd`](SignatureDeclarationBase.md#getend)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4259

***

### getFirstToken()

```ts
getFirstToken(sourceFile?): undefined | Node
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| [`Node`](Node.md)

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFirstToken`](SignatureDeclarationBase.md#getfirsttoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4265

***

### getFullStart()

```ts
getFullStart(): number
```

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFullStart`](SignatureDeclarationBase.md#getfullstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4258

***

### getFullText()

```ts
getFullText(sourceFile?): string
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFullText`](SignatureDeclarationBase.md#getfulltext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4263

***

### getFullWidth()

```ts
getFullWidth(): number
```

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getFullWidth`](SignatureDeclarationBase.md#getfullwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4261

***

### getLastToken()

```ts
getLastToken(sourceFile?): undefined | Node
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| [`Node`](Node.md)

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getLastToken`](SignatureDeclarationBase.md#getlasttoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4266

***

### getLeadingTriviaWidth()

```ts
getLeadingTriviaWidth(sourceFile?): number
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getLeadingTriviaWidth`](SignatureDeclarationBase.md#getleadingtriviawidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4262

***

### getSourceFile()

```ts
getSourceFile(): SourceFile
```

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getSourceFile`](SignatureDeclarationBase.md#getsourcefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4253

***

### getStart()

```ts
getStart(sourceFile?, includeJsDocComment?): number
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **includeJsDocComment?**: `boolean`

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getStart`](SignatureDeclarationBase.md#getstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4257

***

### getText()

```ts
getText(sourceFile?): string
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getText`](SignatureDeclarationBase.md#gettext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4264

***

### getWidth()

```ts
getWidth(sourceFile?): number
```

#### Parameters

• **sourceFile?**: [`SourceFileLike`](SourceFileLike.md)

#### Returns

`number`

#### Inherited from

[`SignatureDeclarationBase`](SignatureDeclarationBase.md).[`getWidth`](SignatureDeclarationBase.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
