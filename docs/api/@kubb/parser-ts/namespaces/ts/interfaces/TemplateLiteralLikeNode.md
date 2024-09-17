[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TemplateLiteralLikeNode

# TemplateLiteralLikeNode

## Extends

- [`LiteralLikeNode`](LiteralLikeNode.md)

## Extended by

- [`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)
- [`TemplateHead`](TemplateHead.md)
- [`TemplateMiddle`](TemplateMiddle.md)
- [`TemplateTail`](TemplateTail.md)

## Properties

### end

```ts
readonly end: number;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`end`](LiteralLikeNode.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`flags`](LiteralLikeNode.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### hasExtendedUnicodeEscape?

```ts
optional hasExtendedUnicodeEscape: boolean;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`hasExtendedUnicodeEscape`](LiteralLikeNode.md#hasextendedunicodeescape)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4950

***

### isUnterminated?

```ts
optional isUnterminated: boolean;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`isUnterminated`](LiteralLikeNode.md#isunterminated)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4949

***

### kind

```ts
readonly kind: SyntaxKind;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`kind`](LiteralLikeNode.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4248

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`parent`](LiteralLikeNode.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`pos`](LiteralLikeNode.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### rawText?

```ts
optional rawText: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4953

***

### text

```ts
text: string;
```

#### Inherited from

[`LiteralLikeNode`](LiteralLikeNode.md).[`text`](LiteralLikeNode.md#text)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`forEachChild`](LiteralLikeNode.md#foreachchild)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getChildAt`](LiteralLikeNode.md#getchildat)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getChildCount`](LiteralLikeNode.md#getchildcount)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getChildren`](LiteralLikeNode.md#getchildren)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getEnd`](LiteralLikeNode.md#getend)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFirstToken`](LiteralLikeNode.md#getfirsttoken)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFullStart`](LiteralLikeNode.md#getfullstart)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFullText`](LiteralLikeNode.md#getfulltext)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getFullWidth`](LiteralLikeNode.md#getfullwidth)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getLastToken`](LiteralLikeNode.md#getlasttoken)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getLeadingTriviaWidth`](LiteralLikeNode.md#getleadingtriviawidth)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getSourceFile`](LiteralLikeNode.md#getsourcefile)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getStart`](LiteralLikeNode.md#getstart)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getText`](LiteralLikeNode.md#gettext)

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

[`LiteralLikeNode`](LiteralLikeNode.md).[`getWidth`](LiteralLikeNode.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
