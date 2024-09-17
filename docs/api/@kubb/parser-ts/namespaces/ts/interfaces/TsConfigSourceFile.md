[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TsConfigSourceFile

# TsConfigSourceFile

## Extends

- [`JsonSourceFile`](JsonSourceFile.md)

## Properties

### \_declarationBrand

```ts
_declarationBrand: any;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`_declarationBrand`](JsonSourceFile.md#declarationbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4432

***

### \_localsContainerBrand

```ts
_localsContainerBrand: any;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`_localsContainerBrand`](JsonSourceFile.md#localscontainerbrand)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4273

***

### amdDependencies

```ts
amdDependencies: readonly AmdDependency[];
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`amdDependencies`](JsonSourceFile.md#amddependencies)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5854

***

### end

```ts
readonly end: number;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`end`](JsonSourceFile.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3624

***

### endOfFileToken

```ts
readonly endOfFileToken: Token<EndOfFileToken>;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`endOfFileToken`](JsonSourceFile.md#endoffiletoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5851

***

### extendedSourceFiles?

```ts
optional extendedSourceFiles: string[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5905

***

### fileName

```ts
fileName: string;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`fileName`](JsonSourceFile.md#filename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5852

***

### flags

```ts
readonly flags: NodeFlags;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`flags`](JsonSourceFile.md#flags)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4249

***

### hasNoDefaultLib

```ts
hasNoDefaultLib: boolean;
```

lib.d.ts should have a reference comment like

 /// <reference no-default-lib="true"/>

If any other file has this comment, it signals not to include lib.d.ts
because this containing file is intended to act as a default library.

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`hasNoDefaultLib`](JsonSourceFile.md#hasnodefaultlib)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5869

***

### impliedNodeFormat?

```ts
optional impliedNodeFormat: ResolutionMode;
```

When `module` is `Node16` or `NodeNext`, this field controls whether the
source file in question is an ESNext-output-format file, or a CommonJS-output-format
module. This is derived by the module resolver as it looks up the file, since
it is derived from either the file extension of the module, or the containing
`package.json` context, and affects both checking and emit.

It is _public_ so that (pre)transformers can set this field,
since it switches the builtin `node` module transform. Generally speaking, if unset,
the field is treated as though it is `ModuleKind.CommonJS`.

Note that this field is only set by the module resolution process when
`moduleResolution` is `Node16` or `NodeNext`, which is implied by the `module` setting
of `Node16` or `NodeNext`, respectively, but may be overriden (eg, by a `moduleResolution`
of `node`). If so, this field will be unset and source files will be considered to be
CommonJS-output-format by the node module transformer and type checker, regardless of extension or context.

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`impliedNodeFormat`](JsonSourceFile.md#impliednodeformat)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5888

***

### isDeclarationFile

```ts
isDeclarationFile: boolean;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`isDeclarationFile`](JsonSourceFile.md#isdeclarationfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5860

***

### kind

```ts
readonly kind: SourceFile;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`kind`](JsonSourceFile.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5849

***

### languageVariant

```ts
languageVariant: LanguageVariant;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`languageVariant`](JsonSourceFile.md#languagevariant)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5859

***

### languageVersion

```ts
languageVersion: ScriptTarget;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`languageVersion`](JsonSourceFile.md#languageversion)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5870

***

### libReferenceDirectives

```ts
libReferenceDirectives: readonly FileReference[];
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`libReferenceDirectives`](JsonSourceFile.md#libreferencedirectives)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5858

***

### moduleName?

```ts
optional moduleName: string;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`moduleName`](JsonSourceFile.md#modulename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5855

***

### parent

```ts
readonly parent: Node;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`parent`](JsonSourceFile.md#parent)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4250

***

### pos

```ts
readonly pos: number;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`pos`](JsonSourceFile.md#pos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3623

***

### referencedFiles

```ts
referencedFiles: readonly FileReference[];
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`referencedFiles`](JsonSourceFile.md#referencedfiles)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5856

***

### statements

```ts
readonly statements: NodeArray<JsonObjectExpressionStatement>;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`statements`](JsonSourceFile.md#statements)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5902

***

### text

```ts
text: string;
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`text`](JsonSourceFile.md#text)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5853

***

### typeReferenceDirectives

```ts
typeReferenceDirectives: readonly FileReference[];
```

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`typeReferenceDirectives`](JsonSourceFile.md#typereferencedirectives)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5857

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

[`JsonSourceFile`](JsonSourceFile.md).[`forEachChild`](JsonSourceFile.md#foreachchild)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getChildAt`](JsonSourceFile.md#getchildat)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getChildCount`](JsonSourceFile.md#getchildcount)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getChildren`](JsonSourceFile.md#getchildren)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getEnd`](JsonSourceFile.md#getend)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getFirstToken`](JsonSourceFile.md#getfirsttoken)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getFullStart`](JsonSourceFile.md#getfullstart)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getFullText`](JsonSourceFile.md#getfulltext)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getFullWidth`](JsonSourceFile.md#getfullwidth)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getLastToken`](JsonSourceFile.md#getlasttoken)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getLeadingTriviaWidth`](JsonSourceFile.md#getleadingtriviawidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4262

***

### getLineAndCharacterOfPosition()

```ts
getLineAndCharacterOfPosition(pos): LineAndCharacter
```

#### Parameters

• **pos**: `number`

#### Returns

[`LineAndCharacter`](LineAndCharacter.md)

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getLineAndCharacterOfPosition`](JsonSourceFile.md#getlineandcharacterofposition)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5891

***

### getLineEndOfPosition()

```ts
getLineEndOfPosition(pos): number
```

#### Parameters

• **pos**: `number`

#### Returns

`number`

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getLineEndOfPosition`](JsonSourceFile.md#getlineendofposition)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5892

***

### getLineStarts()

```ts
getLineStarts(): readonly number[]
```

#### Returns

readonly `number`[]

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getLineStarts`](JsonSourceFile.md#getlinestarts)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5893

***

### getPositionOfLineAndCharacter()

```ts
getPositionOfLineAndCharacter(line, character): number
```

#### Parameters

• **line**: `number`

• **character**: `number`

#### Returns

`number`

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getPositionOfLineAndCharacter`](JsonSourceFile.md#getpositionoflineandcharacter)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5894

***

### getSourceFile()

```ts
getSourceFile(): SourceFile
```

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`getSourceFile`](JsonSourceFile.md#getsourcefile)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getStart`](JsonSourceFile.md#getstart)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getText`](JsonSourceFile.md#gettext)

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

[`JsonSourceFile`](JsonSourceFile.md).[`getWidth`](JsonSourceFile.md#getwidth)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:4260

***

### update()

```ts
update(newText, textChangeRange): SourceFile
```

#### Parameters

• **newText**: `string`

• **textChangeRange**: [`TextChangeRange`](TextChangeRange.md)

#### Returns

[`SourceFile`](SourceFile.md)

#### Inherited from

[`JsonSourceFile`](JsonSourceFile.md).[`update`](JsonSourceFile.md#update)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5895
