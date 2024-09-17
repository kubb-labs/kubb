[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / AutoAccessorPropertyDeclaration

# AutoAccessorPropertyDeclaration

## Extends

- [`PropertyDeclaration`](PropertyDeclaration.md)

## Properties

### \_autoAccessorBrand

```ts
_autoAccessorBrand: any;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4532

***

### \_classElementBrand

```ts
_classElementBrand: any;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`_classElementBrand`](PropertyDeclaration.md#classelementbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5366

***

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`_declarationBrand`](PropertyDeclaration.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### \_jsdocContainerBrand

```ts
_jsdocContainerBrand: any;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`_jsdocContainerBrand`](PropertyDeclaration.md#jsdoccontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4270

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`end`](PropertyDeclaration.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### exclamationToken?

```ts
readonly optional exclamationToken: ExclamationToken;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`exclamationToken`](PropertyDeclaration.md#exclamationtoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4527

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`flags`](PropertyDeclaration.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### initializer?

```ts
readonly optional initializer: Expression;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`initializer`](PropertyDeclaration.md#initializer)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4529

***

### kind

```ts
readonly kind: PropertyDeclaration;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`kind`](PropertyDeclaration.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4522

***

### modifiers?

```ts
readonly optional modifiers: NodeArray<ModifierLike>;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`modifiers`](PropertyDeclaration.md#modifiers)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4524

***

### name

```ts
readonly name: PropertyName;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`name`](PropertyDeclaration.md#name)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4525

***

### parent

```ts
readonly parent: ClassLikeDeclaration;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`parent`](PropertyDeclaration.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4523

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`pos`](PropertyDeclaration.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### questionToken?

```ts
readonly optional questionToken: QuestionToken;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`questionToken`](PropertyDeclaration.md#questiontoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4526

***

### type?

```ts
readonly optional type: TypeNode;
```

#### Inherited from

[`PropertyDeclaration`](PropertyDeclaration.md).[`type`](PropertyDeclaration.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4528

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`forEachChild`](PropertyDeclaration.md#foreachchild)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getChildAt`](PropertyDeclaration.md#getchildat)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getChildCount`](PropertyDeclaration.md#getchildcount)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getChildren`](PropertyDeclaration.md#getchildren)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getEnd`](PropertyDeclaration.md#getend)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFirstToken`](PropertyDeclaration.md#getfirsttoken)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFullStart`](PropertyDeclaration.md#getfullstart)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFullText`](PropertyDeclaration.md#getfulltext)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getFullWidth`](PropertyDeclaration.md#getfullwidth)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getLastToken`](PropertyDeclaration.md#getlasttoken)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getLeadingTriviaWidth`](PropertyDeclaration.md#getleadingtriviawidth)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getSourceFile`](PropertyDeclaration.md#getsourcefile)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getStart`](PropertyDeclaration.md#getstart)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getText`](PropertyDeclaration.md#gettext)

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

[`PropertyDeclaration`](PropertyDeclaration.md).[`getWidth`](PropertyDeclaration.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260
