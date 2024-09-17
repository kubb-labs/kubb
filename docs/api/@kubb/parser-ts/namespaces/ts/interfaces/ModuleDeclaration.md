[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ModuleDeclaration

# ModuleDeclaration

## Extends

- [`DeclarationStatement`](DeclarationStatement.md).[`JSDocContainer`](JSDocContainer.md).[`LocalsContainer`](LocalsContainer.md)

## Extended by

- [`NamespaceDeclaration`](NamespaceDeclaration.md)
- [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`DeclarationStatement`](DeclarationStatement.md).[`_declarationBrand`](DeclarationStatement.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### \_jsdocContainerBrand

```ts
_jsdocContainerBrand: any;
```

#### Inherited from

[`JSDocContainer`](JSDocContainer.md).[`_jsdocContainerBrand`](JSDocContainer.md#jsdoccontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4270

***

### \_localsContainerBrand

```ts
_localsContainerBrand: any;
```

#### Inherited from

[`LocalsContainer`](LocalsContainer.md).[`_localsContainerBrand`](LocalsContainer.md#localscontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4273

***

### \_statementBrand

```ts
_statementBrand: any;
```

#### Inherited from

[`DeclarationStatement`](DeclarationStatement.md).[`_statementBrand`](DeclarationStatement.md#statementbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5210

***

### body?

```ts
readonly optional body: ModuleBody;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5414

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`LocalsContainer`](LocalsContainer.md).[`end`](LocalsContainer.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`LocalsContainer`](LocalsContainer.md).[`flags`](LocalsContainer.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: ModuleDeclaration;
```

#### Overrides

[`LocalsContainer`](LocalsContainer.md).[`kind`](LocalsContainer.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5410

***

### modifiers?

```ts
readonly optional modifiers: NodeArray<ModifierLike>;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5412

***

### name

```ts
readonly name: ModuleName;
```

#### Overrides

[`DeclarationStatement`](DeclarationStatement.md).[`name`](DeclarationStatement.md#name)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5413

***

### parent

```ts
readonly parent: SourceFile | ModuleBody;
```

#### Overrides

[`LocalsContainer`](LocalsContainer.md).[`parent`](LocalsContainer.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5411

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`LocalsContainer`](LocalsContainer.md).[`pos`](LocalsContainer.md#pos)

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

[`LocalsContainer`](LocalsContainer.md).[`forEachChild`](LocalsContainer.md#foreachchild)

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

[`LocalsContainer`](LocalsContainer.md).[`getChildAt`](LocalsContainer.md#getchildat)

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

[`LocalsContainer`](LocalsContainer.md).[`getChildCount`](LocalsContainer.md#getchildcount)

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

[`LocalsContainer`](LocalsContainer.md).[`getChildren`](LocalsContainer.md#getchildren)

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

[`LocalsContainer`](LocalsContainer.md).[`getEnd`](LocalsContainer.md#getend)

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

[`LocalsContainer`](LocalsContainer.md).[`getFirstToken`](LocalsContainer.md#getfirsttoken)

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

[`LocalsContainer`](LocalsContainer.md).[`getFullStart`](LocalsContainer.md#getfullstart)

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

[`LocalsContainer`](LocalsContainer.md).[`getFullText`](LocalsContainer.md#getfulltext)

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

[`LocalsContainer`](LocalsContainer.md).[`getFullWidth`](LocalsContainer.md#getfullwidth)

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

[`LocalsContainer`](LocalsContainer.md).[`getLastToken`](LocalsContainer.md#getlasttoken)

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

[`LocalsContainer`](LocalsContainer.md).[`getLeadingTriviaWidth`](LocalsContainer.md#getleadingtriviawidth)

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

[`LocalsContainer`](LocalsContainer.md).[`getSourceFile`](LocalsContainer.md#getsourcefile)

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

[`LocalsContainer`](LocalsContainer.md).[`getStart`](LocalsContainer.md#getstart)

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

[`LocalsContainer`](LocalsContainer.md).[`getText`](LocalsContainer.md#gettext)

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

[`LocalsContainer`](LocalsContainer.md).[`getWidth`](LocalsContainer.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
