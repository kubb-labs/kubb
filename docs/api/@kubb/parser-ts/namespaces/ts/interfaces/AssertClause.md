[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / AssertClause

# ~~AssertClause~~

## Deprecated

## Extends

- [`ImportAttributes`](ImportAttributes.md)

## Properties

### ~~elements~~

```ts
readonly elements: NodeArray<ImportAttribute>;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`elements`](ImportAttributes.md#elements)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5488

***

### ~~end~~

```ts
readonly end: number;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`end`](ImportAttributes.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### ~~flags~~

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`flags`](ImportAttributes.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### ~~kind~~

```ts
readonly kind: ImportAttributes;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`kind`](ImportAttributes.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5486

***

### ~~multiLine?~~

```ts
readonly optional multiLine: boolean;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`multiLine`](ImportAttributes.md#multiline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5489

***

### ~~parent~~

```ts
readonly parent: ImportDeclaration | ExportDeclaration;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`parent`](ImportAttributes.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5487

***

### ~~pos~~

```ts
readonly pos: number;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`pos`](ImportAttributes.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### ~~token~~

```ts
readonly token: WithKeyword | AssertKeyword;
```

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`token`](ImportAttributes.md#token)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5485

## Methods

### ~~forEachChild()~~

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

[`ImportAttributes`](ImportAttributes.md).[`forEachChild`](ImportAttributes.md#foreachchild)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4267

***

### ~~getChildAt()~~

```ts
getChildAt(index, sourceFile?): Node
```

#### Parameters

• **index**: `number`

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

[`Node`](Node.md)

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getChildAt`](ImportAttributes.md#getchildat)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4255

***

### ~~getChildCount()~~

```ts
getChildCount(sourceFile?): number
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`number`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getChildCount`](ImportAttributes.md#getchildcount)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4254

***

### ~~getChildren()~~

```ts
getChildren(sourceFile?): readonly Node[]
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

readonly [`Node`](Node.md)[]

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getChildren`](ImportAttributes.md#getchildren)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4256

***

### ~~getEnd()~~

```ts
getEnd(): number
```

#### Returns

`number`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getEnd`](ImportAttributes.md#getend)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4259

***

### ~~getFirstToken()~~

```ts
getFirstToken(sourceFile?): undefined | Node
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| [`Node`](Node.md)

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getFirstToken`](ImportAttributes.md#getfirsttoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4265

***

### ~~getFullStart()~~

```ts
getFullStart(): number
```

#### Returns

`number`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getFullStart`](ImportAttributes.md#getfullstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4258

***

### ~~getFullText()~~

```ts
getFullText(sourceFile?): string
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getFullText`](ImportAttributes.md#getfulltext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4263

***

### ~~getFullWidth()~~

```ts
getFullWidth(): number
```

#### Returns

`number`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getFullWidth`](ImportAttributes.md#getfullwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4261

***

### ~~getLastToken()~~

```ts
getLastToken(sourceFile?): undefined | Node
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`undefined` \| [`Node`](Node.md)

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getLastToken`](ImportAttributes.md#getlasttoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4266

***

### ~~getLeadingTriviaWidth()~~

```ts
getLeadingTriviaWidth(sourceFile?): number
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`number`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getLeadingTriviaWidth`](ImportAttributes.md#getleadingtriviawidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4262

***

### ~~getSourceFile()~~

```ts
getSourceFile(): SourceFile
```

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getSourceFile`](ImportAttributes.md#getsourcefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4253

***

### ~~getStart()~~

```ts
getStart(sourceFile?, includeJsDocComment?): number
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **includeJsDocComment?**: `boolean`

#### Returns

`number`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getStart`](ImportAttributes.md#getstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4257

***

### ~~getText()~~

```ts
getText(sourceFile?): string
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

`string`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getText`](ImportAttributes.md#gettext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4264

***

### ~~getWidth()~~

```ts
getWidth(sourceFile?): number
```

#### Parameters

• **sourceFile?**: [`SourceFileLike`](SourceFileLike.md)

#### Returns

`number`

#### Inherited from

[`ImportAttributes`](ImportAttributes.md).[`getWidth`](ImportAttributes.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
