[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ObjectLiteralExpressionBase

# ObjectLiteralExpressionBase\<T\>

This interface is a base interface for ObjectLiteralExpression and JSXAttributes to extend from. JSXAttributes is similar to
ObjectLiteralExpression in that it contains array of properties; however, JSXAttributes' properties can only be
JSXAttribute or JSXSpreadAttribute. ObjectLiteralExpression, on the other hand, can only have properties of type
ObjectLiteralElement (e.g. PropertyAssignment, ShorthandPropertyAssignment etc.)

## Extends

- [`PrimaryExpression`](PrimaryExpression.md).[`Declaration`](Declaration.md)

## Extended by

- [`ObjectLiteralExpression`](ObjectLiteralExpression.md)

## Type Parameters

• **T** *extends* [`ObjectLiteralElement`](ObjectLiteralElement.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`Declaration`](Declaration.md).[`_declarationBrand`](Declaration.md#declarationbrand)

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

### \_leftHandSideExpressionBrand

```ts
_leftHandSideExpressionBrand: any;
```

#### Inherited from

[`PrimaryExpression`](PrimaryExpression.md).[`_leftHandSideExpressionBrand`](PrimaryExpression.md#lefthandsideexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4822

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

### end

```ts
readonly end: number;
```

#### Inherited from

[`Declaration`](Declaration.md).[`end`](Declaration.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`Declaration`](Declaration.md).[`flags`](Declaration.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: SyntaxKind;
```

#### Inherited from

[`Declaration`](Declaration.md).[`kind`](Declaration.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4248

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`Declaration`](Declaration.md).[`parent`](Declaration.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`Declaration`](Declaration.md).[`pos`](Declaration.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### properties

```ts
readonly properties: NodeArray<T>;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5025

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

[`Declaration`](Declaration.md).[`forEachChild`](Declaration.md#foreachchild)

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

[`Declaration`](Declaration.md).[`getChildAt`](Declaration.md#getchildat)

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

[`Declaration`](Declaration.md).[`getChildCount`](Declaration.md#getchildcount)

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

[`Declaration`](Declaration.md).[`getChildren`](Declaration.md#getchildren)

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

[`Declaration`](Declaration.md).[`getEnd`](Declaration.md#getend)

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

[`Declaration`](Declaration.md).[`getFirstToken`](Declaration.md#getfirsttoken)

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

[`Declaration`](Declaration.md).[`getFullStart`](Declaration.md#getfullstart)

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

[`Declaration`](Declaration.md).[`getFullText`](Declaration.md#getfulltext)

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

[`Declaration`](Declaration.md).[`getFullWidth`](Declaration.md#getfullwidth)

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

[`Declaration`](Declaration.md).[`getLastToken`](Declaration.md#getlasttoken)

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

[`Declaration`](Declaration.md).[`getLeadingTriviaWidth`](Declaration.md#getleadingtriviawidth)

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

[`Declaration`](Declaration.md).[`getSourceFile`](Declaration.md#getsourcefile)

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

[`Declaration`](Declaration.md).[`getStart`](Declaration.md#getstart)

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

[`Declaration`](Declaration.md).[`getText`](Declaration.md#gettext)

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

[`Declaration`](Declaration.md).[`getWidth`](Declaration.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
