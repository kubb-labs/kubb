[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Scanner

# Scanner

## Methods

### ~~getStartPos()~~

```ts
getStartPos(): number
```

#### Returns

`number`

#### Deprecated

use [getTokenFullStart](Scanner.md#gettokenfullstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8421

***

### getText()

```ts
getText(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8455

***

### ~~getTextPos()~~

```ts
getTextPos(): number
```

#### Returns

`number`

#### Deprecated

use [getTokenEnd](Scanner.md#gettokenend)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8427

***

### getToken()

```ts
getToken(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8422

***

### getTokenEnd()

```ts
getTokenEnd(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8425

***

### getTokenFullStart()

```ts
getTokenFullStart(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8423

***

### ~~getTokenPos()~~

```ts
getTokenPos(): number
```

#### Returns

`number`

#### Deprecated

use [getTokenStart](Scanner.md#gettokenstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8429

***

### getTokenStart()

```ts
getTokenStart(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8424

***

### getTokenText()

```ts
getTokenText(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8430

***

### getTokenValue()

```ts
getTokenValue(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8431

***

### hasExtendedUnicodeEscape()

```ts
hasExtendedUnicodeEscape(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8433

***

### hasPrecedingLineBreak()

```ts
hasPrecedingLineBreak(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8434

***

### hasUnicodeEscape()

```ts
hasUnicodeEscape(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8432

***

### isIdentifier()

```ts
isIdentifier(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8435

***

### isReservedWord()

```ts
isReservedWord(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8436

***

### isUnterminated()

```ts
isUnterminated(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8437

***

### lookAhead()

```ts
lookAhead<T>(callback): T
```

#### Type Parameters

• **T**

#### Parameters

• **callback**

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8465

***

### reScanAsteriskEqualsToken()

```ts
reScanAsteriskEqualsToken(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8440

***

### reScanGreaterToken()

```ts
reScanGreaterToken(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8438

***

### reScanHashToken()

```ts
reScanHashToken(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8449

***

### reScanInvalidIdentifier()

```ts
reScanInvalidIdentifier(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8451

***

### reScanJsxAttributeValue()

```ts
reScanJsxAttributeValue(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8446

***

### reScanJsxToken()

```ts
reScanJsxToken(allowMultilineJsxText?): JsxTokenSyntaxKind
```

#### Parameters

• **allowMultilineJsxText?**: `boolean`

#### Returns

[`JsxTokenSyntaxKind`](../type-aliases/JsxTokenSyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8447

***

### reScanLessThanToken()

```ts
reScanLessThanToken(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8448

***

### reScanQuestionToken()

```ts
reScanQuestionToken(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8450

***

### reScanSlashToken()

```ts
reScanSlashToken(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8439

***

### ~~reScanTemplateHeadOrNoSubstitutionTemplate()~~

```ts
reScanTemplateHeadOrNoSubstitutionTemplate(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Deprecated

use [reScanTemplateToken](Scanner.md#rescantemplatetoken)(false)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8443

***

### reScanTemplateToken()

```ts
reScanTemplateToken(isTaggedTemplate): SyntaxKind
```

#### Parameters

• **isTaggedTemplate**: `boolean`

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8441

***

### resetTokenState()

```ts
resetTokenState(pos): void
```

#### Parameters

• **pos**: `number`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8464

***

### scan()

```ts
scan(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8454

***

### scanJsDocToken()

```ts
scanJsDocToken(): JSDocSyntaxKind
```

#### Returns

[`JSDocSyntaxKind`](../type-aliases/JSDocSyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8453

***

### scanJsxAttributeValue()

```ts
scanJsxAttributeValue(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8445

***

### scanJsxIdentifier()

```ts
scanJsxIdentifier(): SyntaxKind
```

#### Returns

[`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8444

***

### scanJsxToken()

```ts
scanJsxToken(): JsxTokenSyntaxKind
```

#### Returns

[`JsxTokenSyntaxKind`](../type-aliases/JsxTokenSyntaxKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8452

***

### scanRange()

```ts
scanRange<T>(
   start, 
   length, 
   callback): T
```

#### Type Parameters

• **T**

#### Parameters

• **start**: `number`

• **length**: `number`

• **callback**

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8466

***

### setJSDocParsingMode()

```ts
setJSDocParsingMode(kind): void
```

#### Parameters

• **kind**: [`JSDocParsingMode`](../enumerations/JSDocParsingMode.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8461

***

### setLanguageVariant()

```ts
setLanguageVariant(variant): void
```

#### Parameters

• **variant**: [`LanguageVariant`](../enumerations/LanguageVariant.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8459

***

### setOnError()

```ts
setOnError(onError): void
```

#### Parameters

• **onError**: `undefined` \| [`ErrorCallback`](../type-aliases/ErrorCallback.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8457

***

### setScriptKind()

```ts
setScriptKind(scriptKind): void
```

#### Parameters

• **scriptKind**: [`ScriptKind`](../enumerations/ScriptKind.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8460

***

### setScriptTarget()

```ts
setScriptTarget(scriptTarget): void
```

#### Parameters

• **scriptTarget**: [`ScriptTarget`](../enumerations/ScriptTarget.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8458

***

### setText()

```ts
setText(
   text, 
   start?, 
   length?): void
```

#### Parameters

• **text**: `undefined` \| `string`

• **start?**: `number`

• **length?**: `number`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8456

***

### ~~setTextPos()~~

```ts
setTextPos(textPos): void
```

#### Parameters

• **textPos**: `number`

#### Returns

`void`

#### Deprecated

use [resetTokenState](Scanner.md#resettokenstate)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8463

***

### tryScan()

```ts
tryScan<T>(callback): T
```

#### Type Parameters

• **T**

#### Parameters

• **callback**

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8467
