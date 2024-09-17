[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TemplateMiddle

# TemplateMiddle

## Extends

- [`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md)

## Properties

### end

```ts
readonly end: number;
```

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`end`](TemplateLiteralLikeNode.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`flags`](TemplateLiteralLikeNode.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### hasExtendedUnicodeEscape?

```ts
optional hasExtendedUnicodeEscape: boolean;
```

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`hasExtendedUnicodeEscape`](TemplateLiteralLikeNode.md#hasextendedunicodeescape)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4950

***

### isUnterminated?

```ts
optional isUnterminated: boolean;
```

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`isUnterminated`](TemplateLiteralLikeNode.md#isunterminated)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4949

***

### kind

```ts
readonly kind: TemplateMiddle;
```

#### Overrides

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`kind`](TemplateLiteralLikeNode.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4984

***

### parent

```ts
readonly parent: TemplateLiteralTypeSpan | TemplateSpan;
```

#### Overrides

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`parent`](TemplateLiteralLikeNode.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4985

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`pos`](TemplateLiteralLikeNode.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### rawText?

```ts
optional rawText: string;
```

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`rawText`](TemplateLiteralLikeNode.md#rawtext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4953

***

### text

```ts
text: string;
```

#### Inherited from

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`text`](TemplateLiteralLikeNode.md#text)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4948

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`forEachChild`](TemplateLiteralLikeNode.md#foreachchild)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getChildAt`](TemplateLiteralLikeNode.md#getchildat)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getChildCount`](TemplateLiteralLikeNode.md#getchildcount)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getChildren`](TemplateLiteralLikeNode.md#getchildren)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getEnd`](TemplateLiteralLikeNode.md#getend)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFirstToken`](TemplateLiteralLikeNode.md#getfirsttoken)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFullStart`](TemplateLiteralLikeNode.md#getfullstart)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFullText`](TemplateLiteralLikeNode.md#getfulltext)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getFullWidth`](TemplateLiteralLikeNode.md#getfullwidth)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getLastToken`](TemplateLiteralLikeNode.md#getlasttoken)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getLeadingTriviaWidth`](TemplateLiteralLikeNode.md#getleadingtriviawidth)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getSourceFile`](TemplateLiteralLikeNode.md#getsourcefile)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getStart`](TemplateLiteralLikeNode.md#getstart)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getText`](TemplateLiteralLikeNode.md#gettext)

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

[`TemplateLiteralLikeNode`](TemplateLiteralLikeNode.md).[`getWidth`](TemplateLiteralLikeNode.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
