[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / JSDocParameterTag

# JSDocParameterTag

## Extends

- [`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`_declarationBrand`](JSDocPropertyLikeTag.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### comment?

```ts
readonly optional comment: string | NodeArray<JSDocComment>;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`comment`](JSDocPropertyLikeTag.md#comment)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5678

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`end`](JSDocPropertyLikeTag.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`flags`](JSDocPropertyLikeTag.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### isBracketed

```ts
readonly isBracketed: boolean;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`isBracketed`](JSDocPropertyLikeTag.md#isbracketed)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5804

***

### isNameFirst

```ts
readonly isNameFirst: boolean;
```

Whether the property name came before the type -- non-standard for JSDoc, but Typescript-like

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`isNameFirst`](JSDocPropertyLikeTag.md#isnamefirst)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5803

***

### kind

```ts
readonly kind: JSDocParameterTag;
```

#### Overrides

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`kind`](JSDocPropertyLikeTag.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5810

***

### name

```ts
readonly name: EntityName;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`name`](JSDocPropertyLikeTag.md#name)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5800

***

### parent

```ts
readonly parent: JSDoc;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`parent`](JSDocPropertyLikeTag.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5799

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`pos`](JSDocPropertyLikeTag.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### tagName

```ts
readonly tagName: Identifier;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`tagName`](JSDocPropertyLikeTag.md#tagname)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5677

***

### typeExpression?

```ts
readonly optional typeExpression: JSDocTypeExpression;
```

#### Inherited from

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`typeExpression`](JSDocPropertyLikeTag.md#typeexpression)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5801

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`forEachChild`](JSDocPropertyLikeTag.md#foreachchild)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getChildAt`](JSDocPropertyLikeTag.md#getchildat)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getChildCount`](JSDocPropertyLikeTag.md#getchildcount)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getChildren`](JSDocPropertyLikeTag.md#getchildren)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getEnd`](JSDocPropertyLikeTag.md#getend)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFirstToken`](JSDocPropertyLikeTag.md#getfirsttoken)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFullStart`](JSDocPropertyLikeTag.md#getfullstart)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFullText`](JSDocPropertyLikeTag.md#getfulltext)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getFullWidth`](JSDocPropertyLikeTag.md#getfullwidth)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getLastToken`](JSDocPropertyLikeTag.md#getlasttoken)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getLeadingTriviaWidth`](JSDocPropertyLikeTag.md#getleadingtriviawidth)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getSourceFile`](JSDocPropertyLikeTag.md#getsourcefile)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getStart`](JSDocPropertyLikeTag.md#getstart)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getText`](JSDocPropertyLikeTag.md#gettext)

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

[`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md).[`getWidth`](JSDocPropertyLikeTag.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
