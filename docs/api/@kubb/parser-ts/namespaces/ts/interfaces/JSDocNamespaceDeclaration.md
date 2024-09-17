[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / JSDocNamespaceDeclaration

# JSDocNamespaceDeclaration

## Extends

- [`ModuleDeclaration`](ModuleDeclaration.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`_declarationBrand`](ModuleDeclaration.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### \_jsdocContainerBrand

```ts
_jsdocContainerBrand: any;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`_jsdocContainerBrand`](ModuleDeclaration.md#jsdoccontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4270

***

### \_localsContainerBrand

```ts
_localsContainerBrand: any;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`_localsContainerBrand`](ModuleDeclaration.md#localscontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4273

***

### \_statementBrand

```ts
_statementBrand: any;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`_statementBrand`](ModuleDeclaration.md#statementbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5210

***

### body?

```ts
readonly optional body: JSDocNamespaceBody;
```

#### Overrides

[`ModuleDeclaration`](ModuleDeclaration.md).[`body`](ModuleDeclaration.md#body)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5424

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`end`](ModuleDeclaration.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`flags`](ModuleDeclaration.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### kind

```ts
readonly kind: ModuleDeclaration;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`kind`](ModuleDeclaration.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5410

***

### modifiers?

```ts
readonly optional modifiers: NodeArray<ModifierLike>;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`modifiers`](ModuleDeclaration.md#modifiers)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5412

***

### name

```ts
readonly name: Identifier;
```

#### Overrides

[`ModuleDeclaration`](ModuleDeclaration.md).[`name`](ModuleDeclaration.md#name)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5423

***

### parent

```ts
readonly parent: SourceFile | ModuleBody;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`parent`](ModuleDeclaration.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5411

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`ModuleDeclaration`](ModuleDeclaration.md).[`pos`](ModuleDeclaration.md#pos)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`forEachChild`](ModuleDeclaration.md#foreachchild)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getChildAt`](ModuleDeclaration.md#getchildat)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getChildCount`](ModuleDeclaration.md#getchildcount)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getChildren`](ModuleDeclaration.md#getchildren)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getEnd`](ModuleDeclaration.md#getend)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFirstToken`](ModuleDeclaration.md#getfirsttoken)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFullStart`](ModuleDeclaration.md#getfullstart)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFullText`](ModuleDeclaration.md#getfulltext)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getFullWidth`](ModuleDeclaration.md#getfullwidth)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getLastToken`](ModuleDeclaration.md#getlasttoken)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getLeadingTriviaWidth`](ModuleDeclaration.md#getleadingtriviawidth)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getSourceFile`](ModuleDeclaration.md#getsourcefile)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getStart`](ModuleDeclaration.md#getstart)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getText`](ModuleDeclaration.md#gettext)

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

[`ModuleDeclaration`](ModuleDeclaration.md).[`getWidth`](ModuleDeclaration.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
