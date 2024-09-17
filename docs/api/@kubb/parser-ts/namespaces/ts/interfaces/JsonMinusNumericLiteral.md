[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / JsonMinusNumericLiteral

# JsonMinusNumericLiteral

## Extends

- [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

## Properties

### \_expressionBrand

```ts
_expressionBrand: any;
```

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`_expressionBrand`](PrefixUnaryExpression.md#expressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4792

***

### \_unaryExpressionBrand

```ts
_unaryExpressionBrand: any;
```

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`_unaryExpressionBrand`](PrefixUnaryExpression.md#unaryexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4802

***

### \_updateExpressionBrand

```ts
_updateExpressionBrand: any;
```

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`_updateExpressionBrand`](PrefixUnaryExpression.md#updateexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4807

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`end`](PrefixUnaryExpression.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`flags`](PrefixUnaryExpression.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: PrefixUnaryExpression;
```

#### Overrides

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`kind`](PrefixUnaryExpression.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5908

***

### operand

```ts
readonly operand: NumericLiteral;
```

#### Overrides

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`operand`](PrefixUnaryExpression.md#operand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5910

***

### operator

```ts
readonly operator: MinusToken;
```

#### Overrides

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`operator`](PrefixUnaryExpression.md#operator)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5909

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`parent`](PrefixUnaryExpression.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`pos`](PrefixUnaryExpression.md#pos)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`forEachChild`](PrefixUnaryExpression.md#foreachchild)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getChildAt`](PrefixUnaryExpression.md#getchildat)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getChildCount`](PrefixUnaryExpression.md#getchildcount)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getChildren`](PrefixUnaryExpression.md#getchildren)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getEnd`](PrefixUnaryExpression.md#getend)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFirstToken`](PrefixUnaryExpression.md#getfirsttoken)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFullStart`](PrefixUnaryExpression.md#getfullstart)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFullText`](PrefixUnaryExpression.md#getfulltext)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getFullWidth`](PrefixUnaryExpression.md#getfullwidth)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getLastToken`](PrefixUnaryExpression.md#getlasttoken)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getLeadingTriviaWidth`](PrefixUnaryExpression.md#getleadingtriviawidth)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getSourceFile`](PrefixUnaryExpression.md#getsourcefile)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getStart`](PrefixUnaryExpression.md#getstart)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getText`](PrefixUnaryExpression.md#gettext)

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

[`PrefixUnaryExpression`](PrefixUnaryExpression.md).[`getWidth`](PrefixUnaryExpression.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
