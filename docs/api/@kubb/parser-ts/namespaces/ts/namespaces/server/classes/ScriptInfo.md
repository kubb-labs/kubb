[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / ScriptInfo

# ScriptInfo

## Constructors

### new ScriptInfo()

```ts
new ScriptInfo(
   host, 
   fileName, 
   scriptKind, 
   hasMixedContent, 
   path, 
   initialVersion?): ScriptInfo
```

#### Parameters

• **host**: [`ServerHost`](../interfaces/ServerHost.md)

• **fileName**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

• **scriptKind**: [`ScriptKind`](../../../enumerations/ScriptKind.md)

• **hasMixedContent**: `boolean`

• **path**: [`Path`](../../../type-aliases/Path.md)

• **initialVersion?**: `number`

#### Returns

[`ScriptInfo`](ScriptInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2746

## Properties

### containingProjects

```ts
readonly containingProjects: Project[];
```

All projects that include this file

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2742

***

### fileName

```ts
readonly fileName: NormalizedPath;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2735

***

### hasMixedContent

```ts
readonly hasMixedContent: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2737

***

### path

```ts
readonly path: Path;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2738

***

### scriptKind

```ts
readonly scriptKind: ScriptKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2736

## Methods

### attachToProject()

```ts
attachToProject(project): boolean
```

#### Parameters

• **project**: [`Project`](Project.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2754

***

### close()

```ts
close(fileExists?): void
```

#### Parameters

• **fileExists?**: `boolean`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2749

***

### detachAllProjects()

```ts
detachAllProjects(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2757

***

### detachFromProject()

```ts
detachFromProject(project): void
```

#### Parameters

• **project**: [`Project`](Project.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2756

***

### editContent()

```ts
editContent(
   start, 
   end, 
   newText): void
```

#### Parameters

• **start**: `number`

• **end**: `number`

• **newText**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2764

***

### getDefaultProject()

```ts
getDefaultProject(): Project
```

#### Returns

[`Project`](Project.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2758

***

### getFormatCodeSettings()

```ts
getFormatCodeSettings(): undefined | FormatCodeSettings
```

#### Returns

`undefined` \| [`FormatCodeSettings`](../../../interfaces/FormatCodeSettings.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2752

***

### getLatestVersion()

```ts
getLatestVersion(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2761

***

### getPreferences()

```ts
getPreferences(): undefined | UserPreferences
```

#### Returns

`undefined` \| [`UserPreferences`](../namespaces/protocol/interfaces/UserPreferences.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2753

***

### getSnapshot()

```ts
getSnapshot(): IScriptSnapshot
```

#### Returns

[`IScriptSnapshot`](../../../interfaces/IScriptSnapshot.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2750

***

### isAttached()

```ts
isAttached(project): boolean
```

#### Parameters

• **project**: [`Project`](Project.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2755

***

### isJavaScript()

```ts
isJavaScript(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2777

***

### isOrphan()

```ts
isOrphan(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2766

***

### isScriptOpen()

```ts
isScriptOpen(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2747

***

### lineOffsetToPosition()

```ts
lineOffsetToPosition(line, offset): number
```

#### Parameters

• **line**: `number`

1 based index

• **offset**: `number`

1 based index

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2775

***

### lineToTextSpan()

```ts
lineToTextSpan(line): TextSpan
```

#### Parameters

• **line**: `number`

1 based index

#### Returns

[`TextSpan`](../../../interfaces/TextSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2770

***

### markContainingProjectsAsDirty()

```ts
markContainingProjectsAsDirty(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2765

***

### open()

```ts
open(newText): void
```

#### Parameters

• **newText**: `undefined` \| `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2748

***

### positionToLineOffset()

```ts
positionToLineOffset(position): Location
```

#### Parameters

• **position**: `number`

#### Returns

[`Location`](../namespaces/protocol/interfaces/Location.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2776

***

### registerFileUpdate()

```ts
registerFileUpdate(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2759

***

### reloadFromFile()

```ts
reloadFromFile(tempFileName?): boolean
```

#### Parameters

• **tempFileName?**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2763

***

### saveTo()

```ts
saveTo(fileName): void
```

#### Parameters

• **fileName**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2762

***

### setOptions()

```ts
setOptions(formatSettings, preferences): void
```

#### Parameters

• **formatSettings**: [`FormatCodeSettings`](../../../interfaces/FormatCodeSettings.md)

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/protocol/interfaces/UserPreferences.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2760
