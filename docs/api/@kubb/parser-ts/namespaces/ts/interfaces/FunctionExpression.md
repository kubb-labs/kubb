[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / FunctionExpression

# FunctionExpression

Several node kinds share function-like features such as a signature,
a name, and a body. These nodes should extend FunctionLikeDeclarationBase.
Examples:
- FunctionDeclaration
- MethodDeclaration
- AccessorDeclaration

## Extends

- [`PrimaryExpression`](PrimaryExpression.md).[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`JSDocContainer`](JSDocContainer.md).[`LocalsContainer`](LocalsContainer.md).[`FlowContainer`](FlowContainer.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`_declarationBrand`](FunctionLikeDeclarationBase.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### \_expressionBrand

```ts
_expressionBrand: any;
```

#### Inherited from

[`PrimaryExpression`](PrimaryExpression.md).[`_expressionBrand`](PrimaryExpression.md#expressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4792

***

### \_flowContainerBrand

```ts
_flowContainerBrand: any;
```

#### Inherited from

[`FlowContainer`](FlowContainer.md).[`_flowContainerBrand`](FlowContainer.md#flowcontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4276

***

### \_functionLikeDeclarationBrand

```ts
_functionLikeDeclarationBrand: any;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`_functionLikeDeclarationBrand`](FunctionLikeDeclarationBase.md#functionlikedeclarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4580

***

### \_jsdocContainerBrand

```ts
_jsdocContainerBrand: any;
```

#### Inherited from

[`JSDocContainer`](JSDocContainer.md).[`_jsdocContainerBrand`](JSDocContainer.md#jsdoccontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4270

***

### \_leftHandSideExpressionBrand

```ts
_leftHandSideExpressionBrand: any;
```

#### Inherited from

[`PrimaryExpression`](PrimaryExpression.md).[`_leftHandSideExpressionBrand`](PrimaryExpression.md#lefthandsideexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4822

***

### \_localsContainerBrand

```ts
_localsContainerBrand: any;
```

#### Inherited from

[`LocalsContainer`](LocalsContainer.md).[`_localsContainerBrand`](LocalsContainer.md#localscontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4273

***

### \_memberExpressionBrand

```ts
_memberExpressionBrand: any;
```

#### Inherited from

[`PrimaryExpression`](PrimaryExpression.md).[`_memberExpressionBrand`](PrimaryExpression.md#memberexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4825

***

### \_primaryExpressionBrand

```ts
_primaryExpressionBrand: any;
```

#### Inherited from

[`PrimaryExpression`](PrimaryExpression.md).[`_primaryExpressionBrand`](PrimaryExpression.md#primaryexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4828

***

### \_unaryExpressionBrand

```ts
_unaryExpressionBrand: any;
```

#### Inherited from

[`PrimaryExpression`](PrimaryExpression.md).[`_unaryExpressionBrand`](PrimaryExpression.md#unaryexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4802

***

### \_updateExpressionBrand

```ts
_updateExpressionBrand: any;
```

#### Inherited from

[`PrimaryExpression`](PrimaryExpression.md).[`_updateExpressionBrand`](PrimaryExpression.md#updateexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4807

***

### asteriskToken?

```ts
readonly optional asteriskToken: AsteriskToken;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`asteriskToken`](FunctionLikeDeclarationBase.md#asterisktoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4581

***

### body

```ts
readonly body: Block;
```

#### Overrides

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`body`](FunctionLikeDeclarationBase.md#body)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4938

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`FlowContainer`](FlowContainer.md).[`end`](FlowContainer.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### exclamationToken?

```ts
readonly optional exclamationToken: ExclamationToken;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`exclamationToken`](FunctionLikeDeclarationBase.md#exclamationtoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4583

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`FlowContainer`](FlowContainer.md).[`flags`](FlowContainer.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: FunctionExpression;
```

#### Overrides

[`FlowContainer`](FlowContainer.md).[`kind`](FlowContainer.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4935

***

### modifiers?

```ts
readonly optional modifiers: NodeArray<Modifier>;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4936

***

### name?

```ts
readonly optional name: Identifier;
```

#### Overrides

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`name`](FunctionLikeDeclarationBase.md#name)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4937

***

### parameters

```ts
readonly parameters: NodeArray<ParameterDeclaration>;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`parameters`](FunctionLikeDeclarationBase.md#parameters)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4471

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`FlowContainer`](FlowContainer.md).[`parent`](FlowContainer.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`FlowContainer`](FlowContainer.md).[`pos`](FlowContainer.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### questionToken?

```ts
readonly optional questionToken: QuestionToken;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`questionToken`](FunctionLikeDeclarationBase.md#questiontoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4582

***

### type?

```ts
readonly optional type: TypeNode;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`type`](FunctionLikeDeclarationBase.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4472

***

### typeParameters?

```ts
readonly optional typeParameters: NodeArray<TypeParameterDeclaration>;
```

#### Inherited from

[`FunctionLikeDeclarationBase`](FunctionLikeDeclarationBase.md).[`typeParameters`](FunctionLikeDeclarationBase.md#typeparameters)

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

[`FlowContainer`](FlowContainer.md).[`forEachChild`](FlowContainer.md#foreachchild)

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

[`FlowContainer`](FlowContainer.md).[`getChildAt`](FlowContainer.md#getchildat)

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

[`FlowContainer`](FlowContainer.md).[`getChildCount`](FlowContainer.md#getchildcount)

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

[`FlowContainer`](FlowContainer.md).[`getChildren`](FlowContainer.md#getchildren)

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

[`FlowContainer`](FlowContainer.md).[`getEnd`](FlowContainer.md#getend)

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

[`FlowContainer`](FlowContainer.md).[`getFirstToken`](FlowContainer.md#getfirsttoken)

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

[`FlowContainer`](FlowContainer.md).[`getFullStart`](FlowContainer.md#getfullstart)

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

[`FlowContainer`](FlowContainer.md).[`getFullText`](FlowContainer.md#getfulltext)

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

[`FlowContainer`](FlowContainer.md).[`getFullWidth`](FlowContainer.md#getfullwidth)

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

[`FlowContainer`](FlowContainer.md).[`getLastToken`](FlowContainer.md#getlasttoken)

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

[`FlowContainer`](FlowContainer.md).[`getLeadingTriviaWidth`](FlowContainer.md#getleadingtriviawidth)

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

[`FlowContainer`](FlowContainer.md).[`getSourceFile`](FlowContainer.md#getsourcefile)

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

[`FlowContainer`](FlowContainer.md).[`getStart`](FlowContainer.md#getstart)

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

[`FlowContainer`](FlowContainer.md).[`getText`](FlowContainer.md#gettext)

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

[`FlowContainer`](FlowContainer.md).[`getWidth`](FlowContainer.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
