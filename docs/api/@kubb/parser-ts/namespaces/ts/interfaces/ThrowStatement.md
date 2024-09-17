[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ThrowStatement

# ThrowStatement

## Extends

- [`Statement`](Statement.md).[`FlowContainer`](FlowContainer.md)

## Properties

### \_flowContainerBrand

```ts
_flowContainerBrand: any;
```

#### Inherited from

[`FlowContainer`](FlowContainer.md).[`_flowContainerBrand`](FlowContainer.md#flowcontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4276

***

### \_jsdocContainerBrand

```ts
_jsdocContainerBrand: any;
```

#### Inherited from

[`Statement`](Statement.md).[`_jsdocContainerBrand`](Statement.md#jsdoccontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4270

***

### \_statementBrand

```ts
_statementBrand: any;
```

#### Inherited from

[`Statement`](Statement.md).[`_statementBrand`](Statement.md#statementbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5210

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

### expression

```ts
readonly expression: Expression;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5330

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
readonly kind: ThrowStatement;
```

#### Overrides

[`FlowContainer`](FlowContainer.md).[`kind`](FlowContainer.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5329

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
