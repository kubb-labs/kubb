[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Node

# Node

## Extends

- [`ReadonlyTextRange`](ReadonlyTextRange.md)

## Extended by

- [`JSDocContainer`](JSDocContainer.md)
- [`LocalsContainer`](LocalsContainer.md)
- [`FlowContainer`](FlowContainer.md)
- [`Token`](Token.md)
- [`QualifiedName`](QualifiedName.md)
- [`Declaration`](Declaration.md)
- [`ComputedPropertyName`](ComputedPropertyName.md)
- [`Decorator`](Decorator.md)
- [`VariableDeclarationList`](VariableDeclarationList.md)
- [`ObjectBindingPattern`](ObjectBindingPattern.md)
- [`ArrayBindingPattern`](ArrayBindingPattern.md)
- [`TypeNode`](TypeNode.md)
- [`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)
- [`Expression`](Expression.md)
- [`LiteralLikeNode`](LiteralLikeNode.md)
- [`TemplateSpan`](TemplateSpan.md)
- [`JsxNamespacedName`](JsxNamespacedName.md)
- [`JsxClosingElement`](JsxClosingElement.md)
- [`Statement`](Statement.md)
- [`CaseBlock`](CaseBlock.md)
- [`CaseClause`](CaseClause.md)
- [`DefaultClause`](DefaultClause.md)
- [`CatchClause`](CatchClause.md)
- [`HeritageClause`](HeritageClause.md)
- [`ModuleBlock`](ModuleBlock.md)
- [`ExternalModuleReference`](ExternalModuleReference.md)
- [`ImportAttribute`](ImportAttribute.md)
- [`ImportAttributes`](ImportAttributes.md)
- [`NamedImports`](NamedImports.md)
- [`NamedExports`](NamedExports.md)
- [`JSDocNameReference`](JSDocNameReference.md)
- [`JSDocMemberName`](JSDocMemberName.md)
- [`JSDoc`](JSDoc.md)
- [`JSDocTag`](JSDocTag.md)
- [`JSDocLink`](JSDocLink.md)
- [`JSDocLinkCode`](JSDocLinkCode.md)
- [`JSDocLinkPlain`](JSDocLinkPlain.md)
- [`JSDocText`](JSDocText.md)
- [`Bundle`](Bundle.md)
- [`SyntaxList`](SyntaxList.md)

## Properties

### end

```ts
readonly end: number;
```

#### Inherited from

[`ReadonlyTextRange`](ReadonlyTextRange.md).[`end`](ReadonlyTextRange.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: SyntaxKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4248

***

### parent

```ts
readonly parent: Node;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`ReadonlyTextRange`](ReadonlyTextRange.md).[`pos`](ReadonlyTextRange.md#pos)

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4256

***

### getEnd()

```ts
getEnd(): number
```

#### Returns

`number`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4265

***

### getFullStart()

```ts
getFullStart(): number
```

#### Returns

`number`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4263

***

### getFullWidth()

```ts
getFullWidth(): number
```

#### Returns

`number`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4262

***

### getSourceFile()

```ts
getSourceFile(): SourceFile
```

#### Returns

[`SourceFile`](SourceFile.md)

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
