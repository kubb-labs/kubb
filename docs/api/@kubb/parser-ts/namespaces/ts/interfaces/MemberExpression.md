[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / MemberExpression

# MemberExpression

## Extends

- [`LeftHandSideExpression`](LeftHandSideExpression.md)

## Extended by

- [`PrimaryExpression`](PrimaryExpression.md)
- [`PropertyAccessExpression`](PropertyAccessExpression.md)
- [`ElementAccessExpression`](ElementAccessExpression.md)
- [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)
- [`TaggedTemplateExpression`](TaggedTemplateExpression.md)

## Properties

### \_expressionBrand

```ts
_expressionBrand: any;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_expressionBrand`](LeftHandSideExpression.md#expressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4792

***

### \_leftHandSideExpressionBrand

```ts
_leftHandSideExpressionBrand: any;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_leftHandSideExpressionBrand`](LeftHandSideExpression.md#lefthandsideexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4822

***

### \_memberExpressionBrand

```ts
_memberExpressionBrand: any;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4825

***

### \_unaryExpressionBrand

```ts
_unaryExpressionBrand: any;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_unaryExpressionBrand`](LeftHandSideExpression.md#unaryexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4802

***

### \_updateExpressionBrand

```ts
_updateExpressionBrand: any;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`_updateExpressionBrand`](LeftHandSideExpression.md#updateexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4807

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`end`](LeftHandSideExpression.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`flags`](LeftHandSideExpression.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: SyntaxKind;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`kind`](LeftHandSideExpression.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4248

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`parent`](LeftHandSideExpression.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`pos`](LeftHandSideExpression.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`forEachChild`](LeftHandSideExpression.md#foreachchild)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getChildAt`](LeftHandSideExpression.md#getchildat)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getChildCount`](LeftHandSideExpression.md#getchildcount)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getChildren`](LeftHandSideExpression.md#getchildren)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getEnd`](LeftHandSideExpression.md#getend)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFirstToken`](LeftHandSideExpression.md#getfirsttoken)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFullStart`](LeftHandSideExpression.md#getfullstart)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFullText`](LeftHandSideExpression.md#getfulltext)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getFullWidth`](LeftHandSideExpression.md#getfullwidth)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getLastToken`](LeftHandSideExpression.md#getlasttoken)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getLeadingTriviaWidth`](LeftHandSideExpression.md#getleadingtriviawidth)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getSourceFile`](LeftHandSideExpression.md#getsourcefile)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getStart`](LeftHandSideExpression.md#getstart)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getText`](LeftHandSideExpression.md#gettext)

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

[`LeftHandSideExpression`](LeftHandSideExpression.md).[`getWidth`](LeftHandSideExpression.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
