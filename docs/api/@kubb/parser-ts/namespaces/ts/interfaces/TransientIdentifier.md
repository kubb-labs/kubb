[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TransientIdentifier

# TransientIdentifier

## Extends

- [`Identifier`](Identifier.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_declarationBrand`](Identifier.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### \_expressionBrand

```ts
_expressionBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_expressionBrand`](Identifier.md#expressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4792

***

### \_flowContainerBrand

```ts
_flowContainerBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_flowContainerBrand`](Identifier.md#flowcontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4276

***

### \_jsdocContainerBrand

```ts
_jsdocContainerBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_jsdocContainerBrand`](Identifier.md#jsdoccontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4270

***

### \_leftHandSideExpressionBrand

```ts
_leftHandSideExpressionBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_leftHandSideExpressionBrand`](Identifier.md#lefthandsideexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4822

***

### \_memberExpressionBrand

```ts
_memberExpressionBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_memberExpressionBrand`](Identifier.md#memberexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4825

***

### \_primaryExpressionBrand

```ts
_primaryExpressionBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_primaryExpressionBrand`](Identifier.md#primaryexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4828

***

### \_unaryExpressionBrand

```ts
_unaryExpressionBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_unaryExpressionBrand`](Identifier.md#unaryexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4802

***

### \_updateExpressionBrand

```ts
_updateExpressionBrand: any;
```

#### Inherited from

[`Identifier`](Identifier.md).[`_updateExpressionBrand`](Identifier.md#updateexpressionbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4807

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`Identifier`](Identifier.md).[`end`](Identifier.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### escapedText

```ts
readonly escapedText: __String;
```

Prefer to use `id.unescapedText`. (Note: This is available only in services, not internally to the TypeScript compiler.)
Text of identifier, but if the identifier begins with two underscores, this will begin with three.

#### Inherited from

[`Identifier`](Identifier.md).[`escapedText`](Identifier.md#escapedtext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4414

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`Identifier`](Identifier.md).[`flags`](Identifier.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: Identifier;
```

#### Inherited from

[`Identifier`](Identifier.md).[`kind`](Identifier.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4409

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`Identifier`](Identifier.md).[`parent`](Identifier.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`Identifier`](Identifier.md).[`pos`](Identifier.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### resolvedSymbol

```ts
resolvedSymbol: Symbol;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4420

***

### text

```ts
readonly text: string;
```

#### Inherited from

[`Identifier`](Identifier.md).[`text`](Identifier.md#text)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4417

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

[`Identifier`](Identifier.md).[`forEachChild`](Identifier.md#foreachchild)

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

[`Identifier`](Identifier.md).[`getChildAt`](Identifier.md#getchildat)

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

[`Identifier`](Identifier.md).[`getChildCount`](Identifier.md#getchildcount)

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

[`Identifier`](Identifier.md).[`getChildren`](Identifier.md#getchildren)

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

[`Identifier`](Identifier.md).[`getEnd`](Identifier.md#getend)

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

[`Identifier`](Identifier.md).[`getFirstToken`](Identifier.md#getfirsttoken)

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

[`Identifier`](Identifier.md).[`getFullStart`](Identifier.md#getfullstart)

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

[`Identifier`](Identifier.md).[`getFullText`](Identifier.md#getfulltext)

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

[`Identifier`](Identifier.md).[`getFullWidth`](Identifier.md#getfullwidth)

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

[`Identifier`](Identifier.md).[`getLastToken`](Identifier.md#getlasttoken)

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

[`Identifier`](Identifier.md).[`getLeadingTriviaWidth`](Identifier.md#getleadingtriviawidth)

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

[`Identifier`](Identifier.md).[`getSourceFile`](Identifier.md#getsourcefile)

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

[`Identifier`](Identifier.md).[`getStart`](Identifier.md#getstart)

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

[`Identifier`](Identifier.md).[`getText`](Identifier.md#gettext)

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

[`Identifier`](Identifier.md).[`getWidth`](Identifier.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
