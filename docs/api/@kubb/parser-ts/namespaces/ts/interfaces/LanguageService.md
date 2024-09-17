[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / LanguageService

# LanguageService

## Methods

### applyCodeActionCommand()

#### applyCodeActionCommand(action, formatSettings)

```ts
applyCodeActionCommand(action, formatSettings?): Promise<ApplyCodeActionCommandResult>
```

##### Parameters

• **action**: [`InstallPackageAction`](InstallPackageAction.md)

• **formatSettings?**: [`FormatCodeSettings`](FormatCodeSettings.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10147

#### applyCodeActionCommand(action, formatSettings)

```ts
applyCodeActionCommand(action, formatSettings?): Promise<ApplyCodeActionCommandResult[]>
```

##### Parameters

• **action**: [`InstallPackageAction`](InstallPackageAction.md)[]

• **formatSettings?**: [`FormatCodeSettings`](FormatCodeSettings.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10148

#### applyCodeActionCommand(action, formatSettings)

```ts
applyCodeActionCommand(action, formatSettings?): Promise<ApplyCodeActionCommandResult | ApplyCodeActionCommandResult[]>
```

##### Parameters

• **action**: [`InstallPackageAction`](InstallPackageAction.md) \| [`InstallPackageAction`](InstallPackageAction.md)[]

• **formatSettings?**: [`FormatCodeSettings`](FormatCodeSettings.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md) \| [`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10149

#### applyCodeActionCommand(fileName, action)

```ts
applyCodeActionCommand(fileName, action): Promise<ApplyCodeActionCommandResult>
```

##### Parameters

• **fileName**: `string`

• **action**: [`InstallPackageAction`](InstallPackageAction.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

##### Deprecated

`fileName` will be ignored

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10151

#### applyCodeActionCommand(fileName, action)

```ts
applyCodeActionCommand(fileName, action): Promise<ApplyCodeActionCommandResult[]>
```

##### Parameters

• **fileName**: `string`

• **action**: [`InstallPackageAction`](InstallPackageAction.md)[]

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

##### Deprecated

`fileName` will be ignored

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10153

#### applyCodeActionCommand(fileName, action)

```ts
applyCodeActionCommand(fileName, action): Promise<ApplyCodeActionCommandResult | ApplyCodeActionCommandResult[]>
```

##### Parameters

• **fileName**: `string`

• **action**: [`InstallPackageAction`](InstallPackageAction.md) \| [`InstallPackageAction`](InstallPackageAction.md)[]

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md) \| [`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

##### Deprecated

`fileName` will be ignored

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10155

***

### cleanupSemanticCache()

```ts
cleanupSemanticCache(): void
```

This is used as a part of restarting the language service.

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10007

***

### commentSelection()

```ts
commentSelection(fileName, textRange): TextChange[]
```

#### Parameters

• **fileName**: `string`

• **textRange**: [`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10174

***

### dispose()

```ts
dispose(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10177

***

### findReferences()

```ts
findReferences(fileName, position): undefined | ReferencedSymbol[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| [`ReferencedSymbol`](ReferencedSymbol.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10118

***

### findRenameLocations()

#### findRenameLocations(fileName, position, findInStrings, findInComments, preferences)

```ts
findRenameLocations(
   fileName, 
   position, 
   findInStrings, 
   findInComments, 
   preferences): undefined | readonly RenameLocation[]
```

##### Parameters

• **fileName**: `string`

• **position**: `number`

• **findInStrings**: `boolean`

• **findInComments**: `boolean`

• **preferences**: [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

##### Returns

`undefined` \| readonly [`RenameLocation`](RenameLocation.md)[]

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10109

#### findRenameLocations(fileName, position, findInStrings, findInComments, providePrefixAndSuffixTextForRename)

```ts
findRenameLocations(
   fileName, 
   position, 
   findInStrings, 
   findInComments, 
   providePrefixAndSuffixTextForRename?): undefined | readonly RenameLocation[]
```

##### Parameters

• **fileName**: `string`

• **position**: `number`

• **findInStrings**: `boolean`

• **findInComments**: `boolean`

• **providePrefixAndSuffixTextForRename?**: `boolean`

##### Returns

`undefined` \| readonly [`RenameLocation`](RenameLocation.md)[]

##### Deprecated

Pass `providePrefixAndSuffixTextForRename` as part of a `UserPreferences` parameter.

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10111

***

### getApplicableRefactors()

```ts
getApplicableRefactors(
   fileName, 
   positionOrRange, 
   preferences, 
   triggerReason?, 
   kind?, 
   includeInteractiveActions?): ApplicableRefactorInfo[]
```

#### Parameters

• **fileName**: `string`

• **positionOrRange**: `number` \| [`TextRange`](TextRange.md)

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

• **triggerReason?**: [`RefactorTriggerReason`](../namespaces/server/namespaces/protocol/type-aliases/RefactorTriggerReason.md)

• **kind?**: `string`

• **includeInteractiveActions?**: `boolean`

Include refactor actions that require additional arguments to be
passed when calling `getEditsForRefactor`. When true, clients should inspect the `isInteractive`
property of each returned `RefactorActionInfo` and ensure they are able to collect the appropriate
arguments for any interactive action before offering it.

#### Returns

[`ApplicableRefactorInfo`](../namespaces/server/namespaces/protocol/interfaces/ApplicableRefactorInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10162

***

### getBraceMatchingAtPosition()

```ts
getBraceMatchingAtPosition(fileName, position): TextSpan[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

[`TextSpan`](TextSpan.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10130

***

### getBreakpointStatementAtPosition()

```ts
getBreakpointStatementAtPosition(fileName, position): undefined | TextSpan
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| [`TextSpan`](TextSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10104

***

### getCodeFixesAtPosition()

```ts
getCodeFixesAtPosition(
   fileName, 
   start, 
   end, 
   errorCodes, 
   formatOptions, 
   preferences): readonly CodeFixAction[]
```

#### Parameters

• **fileName**: `string`

• **start**: `number`

• **end**: `number`

• **errorCodes**: readonly `number`[]

• **formatOptions**: [`FormatCodeSettings`](FormatCodeSettings.md)

• **preferences**: [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

#### Returns

readonly [`CodeFixAction`](CodeFixAction.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10145

***

### getCombinedCodeFix()

```ts
getCombinedCodeFix(
   scope, 
   fixId, 
   formatOptions, 
   preferences): CombinedCodeActions
```

#### Parameters

• **scope**: [`CombinedCodeFixScope`](CombinedCodeFixScope.md)

• **fixId**

• **formatOptions**: [`FormatCodeSettings`](FormatCodeSettings.md)

• **preferences**: [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

#### Returns

[`CombinedCodeActions`](CombinedCodeActions.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10146

***

### getCompilerOptionsDiagnostics()

```ts
getCompilerOptionsDiagnostics(): Diagnostic[]
```

Gets global diagnostics related to the program configuration and compiler options.

#### Returns

[`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10053

***

### getCompletionEntryDetails()

```ts
getCompletionEntryDetails(
   fileName, 
   position, 
   entryName, 
   formatOptions, 
   source, 
   preferences, 
   data): undefined | CompletionEntryDetails
```

Gets the extended details for a completion entry retrieved from `getCompletionsAtPosition`.

#### Parameters

• **fileName**: `string`

The path to the file

• **position**: `number`

A zero based index of the character where you want the entries

• **entryName**: `string`

The `name` from an existing completion which came from `getCompletionsAtPosition`

• **formatOptions**: `undefined` \| [`FormatCodeSettings`](FormatCodeSettings.md) \| [`FormatCodeOptions`](FormatCodeOptions.md)

How should code samples in the completions be formatted, can be undefined for backwards compatibility

• **source**: `undefined` \| `string`

`source` property from the completion entry

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

User settings, can be undefined for backwards compatibility

• **data**: `undefined` \| [`CompletionEntryData`](../type-aliases/CompletionEntryData.md)

`data` property from the completion entry

#### Returns

`undefined` \| [`CompletionEntryDetails`](CompletionEntryDetails.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10093

***

### getCompletionEntrySymbol()

```ts
getCompletionEntrySymbol(
   fileName, 
   position, 
   name, 
   source): undefined | Symbol
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **name**: `string`

• **source**: `undefined` \| `string`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10094

***

### getCompletionsAtPosition()

```ts
getCompletionsAtPosition(
   fileName, 
   position, 
   options, 
formattingSettings?): undefined | WithMetadata<CompletionInfo>
```

Gets completion entries at a particular position in a file.

#### Parameters

• **fileName**: `string`

The path to the file

• **position**: `number`

A zero-based index of the character where you want the entries

• **options**: `undefined` \| [`GetCompletionsAtPositionOptions`](GetCompletionsAtPositionOptions.md)

An object describing how the request was triggered and what kinds
of code actions can be returned with the completions.

• **formattingSettings?**: [`FormatCodeSettings`](FormatCodeSettings.md)

settings needed for calling formatting functions.

#### Returns

`undefined` \| [`WithMetadata`](../type-aliases/WithMetadata.md)\<[`CompletionInfo`](CompletionInfo.md)\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10081

***

### getDefinitionAndBoundSpan()

```ts
getDefinitionAndBoundSpan(fileName, position): undefined | DefinitionInfoAndBoundSpan
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| [`DefinitionInfoAndBoundSpan`](DefinitionInfoAndBoundSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10114

***

### getDefinitionAtPosition()

```ts
getDefinitionAtPosition(fileName, position): undefined | readonly DefinitionInfo[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| readonly [`DefinitionInfo`](DefinitionInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10113

***

### getDocCommentTemplateAtPosition()

```ts
getDocCommentTemplateAtPosition(
   fileName, 
   position, 
   options?, 
   formatOptions?): undefined | TextInsertion
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **options?**: [`DocCommentTemplateOptions`](DocCommentTemplateOptions.md)

• **formatOptions?**: [`FormatCodeSettings`](FormatCodeSettings.md)

#### Returns

`undefined` \| [`TextInsertion`](TextInsertion.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10135

***

### getDocumentHighlights()

```ts
getDocumentHighlights(
   fileName, 
   position, 
   filesToSearch): undefined | DocumentHighlights[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **filesToSearch**: `string`[]

#### Returns

`undefined` \| [`DocumentHighlights`](DocumentHighlights.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10119

***

### getEditsForFileRename()

```ts
getEditsForFileRename(
   oldFilePath, 
   newFilePath, 
   formatOptions, 
   preferences): readonly FileTextChanges[]
```

#### Parameters

• **oldFilePath**: `string`

• **newFilePath**: `string`

• **formatOptions**: [`FormatCodeSettings`](FormatCodeSettings.md)

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

#### Returns

readonly [`FileTextChanges`](FileTextChanges.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10169

***

### getEditsForRefactor()

```ts
getEditsForRefactor(
   fileName, 
   formatOptions, 
   positionOrRange, 
   refactorName, 
   actionName, 
   preferences, 
   interactiveRefactorArguments?): undefined | RefactorEditInfo
```

#### Parameters

• **fileName**: `string`

• **formatOptions**: [`FormatCodeSettings`](FormatCodeSettings.md)

• **positionOrRange**: `number` \| [`TextRange`](TextRange.md)

• **refactorName**: `string`

• **actionName**: `string`

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

• **interactiveRefactorArguments?**: [`InteractiveRefactorArguments`](InteractiveRefactorArguments.md)

#### Returns

`undefined` \| [`RefactorEditInfo`](RefactorEditInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10163

***

### getEmitOutput()

```ts
getEmitOutput(
   fileName, 
   emitOnlyDtsFiles?, 
   forceDtsEmit?): EmitOutput
```

#### Parameters

• **fileName**: `string`

• **emitOnlyDtsFiles?**: `boolean`

• **forceDtsEmit?**: `boolean`

#### Returns

[`EmitOutput`](EmitOutput.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10170

***

### getEncodedSemanticClassifications()

```ts
getEncodedSemanticClassifications(
   fileName, 
   span, 
   format?): Classifications
```

Gets semantic highlights information for a particular file. Has two formats, an older
version used by VS and a format used by VS Code.

#### Parameters

• **fileName**: `string`

The path to the file

• **span**: [`TextSpan`](TextSpan.md)

• **format?**: [`SemanticClassificationFormat`](../enumerations/SemanticClassificationFormat.md)

Which format to use, defaults to "original"

#### Returns

[`Classifications`](Classifications.md)

a number array encoded as triples of [start, length, ClassificationType, ...].

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10071

***

### getEncodedSyntacticClassifications()

```ts
getEncodedSyntacticClassifications(fileName, span): Classifications
```

Encoded as triples of [start, length, ClassificationType].

#### Parameters

• **fileName**: `string`

• **span**: [`TextSpan`](TextSpan.md)

#### Returns

[`Classifications`](Classifications.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10061

***

### getFileReferences()

```ts
getFileReferences(fileName): ReferenceEntry[]
```

#### Parameters

• **fileName**: `string`

#### Returns

[`ReferenceEntry`](ReferenceEntry.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10120

***

### getFormattingEditsAfterKeystroke()

```ts
getFormattingEditsAfterKeystroke(
   fileName, 
   position, 
   key, 
   options): TextChange[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **key**: `string`

• **options**: [`FormatCodeSettings`](FormatCodeSettings.md) \| [`FormatCodeOptions`](FormatCodeOptions.md)

#### Returns

[`TextChange`](TextChange.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10134

***

### getFormattingEditsForDocument()

```ts
getFormattingEditsForDocument(fileName, options): TextChange[]
```

#### Parameters

• **fileName**: `string`

• **options**: [`FormatCodeSettings`](FormatCodeSettings.md) \| [`FormatCodeOptions`](FormatCodeOptions.md)

#### Returns

[`TextChange`](TextChange.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10133

***

### getFormattingEditsForRange()

```ts
getFormattingEditsForRange(
   fileName, 
   start, 
   end, 
   options): TextChange[]
```

#### Parameters

• **fileName**: `string`

• **start**: `number`

• **end**: `number`

• **options**: [`FormatCodeSettings`](FormatCodeSettings.md) \| [`FormatCodeOptions`](FormatCodeOptions.md)

#### Returns

[`TextChange`](TextChange.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10132

***

### getImplementationAtPosition()

```ts
getImplementationAtPosition(fileName, position): undefined | readonly ImplementationLocation[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| readonly [`ImplementationLocation`](ImplementationLocation.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10116

***

### getIndentationAtPosition()

```ts
getIndentationAtPosition(
   fileName, 
   position, 
   options): number
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **options**: [`EditorSettings`](EditorSettings.md) \| [`EditorOptions`](EditorOptions.md)

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10131

***

### getJsxClosingTagAtPosition()

```ts
getJsxClosingTagAtPosition(fileName, position): undefined | JsxClosingTagInfo
```

This will return a defined result if the position is after the `>` of the opening tag, or somewhere in the text, of a JSXElement with no closing tag.
Editors should call this after `>` is typed.

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| [`JsxClosingTagInfo`](JsxClosingTagInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10141

***

### getLinkedEditingRangeAtPosition()

```ts
getLinkedEditingRangeAtPosition(fileName, position): undefined | LinkedEditingInfo
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| [`LinkedEditingInfo`](LinkedEditingInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10142

***

### getMoveToRefactoringFileSuggestions()

```ts
getMoveToRefactoringFileSuggestions(
   fileName, 
   positionOrRange, 
   preferences, 
   triggerReason?, 
   kind?): object
```

#### Parameters

• **fileName**: `string`

• **positionOrRange**: `number` \| [`TextRange`](TextRange.md)

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

• **triggerReason?**: [`RefactorTriggerReason`](../namespaces/server/namespaces/protocol/type-aliases/RefactorTriggerReason.md)

• **kind?**: `string`

#### Returns

`object`

##### files

```ts
files: string[];
```

##### newFileName

```ts
newFileName: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10164

***

### getNameOrDottedNameSpan()

```ts
getNameOrDottedNameSpan(
   fileName, 
   startPos, 
   endPos): undefined | TextSpan
```

#### Parameters

• **fileName**: `string`

• **startPos**: `number`

• **endPos**: `number`

#### Returns

`undefined` \| [`TextSpan`](TextSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10103

***

### getNavigateToItems()

```ts
getNavigateToItems(
   searchValue, 
   maxResultCount?, 
   fileName?, 
   excludeDtsFiles?, 
   excludeLibFiles?): NavigateToItem[]
```

#### Parameters

• **searchValue**: `string`

• **maxResultCount?**: `number`

• **fileName?**: `string`

• **excludeDtsFiles?**: `boolean`

• **excludeLibFiles?**: `boolean`

#### Returns

[`NavigateToItem`](NavigateToItem.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10121

***

### getNavigationBarItems()

```ts
getNavigationBarItems(fileName): NavigationBarItem[]
```

#### Parameters

• **fileName**: `string`

#### Returns

[`NavigationBarItem`](NavigationBarItem.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10122

***

### getNavigationTree()

```ts
getNavigationTree(fileName): NavigationTree
```

#### Parameters

• **fileName**: `string`

#### Returns

[`NavigationTree`](NavigationTree.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10123

***

### getOutliningSpans()

```ts
getOutliningSpans(fileName): OutliningSpan[]
```

#### Parameters

• **fileName**: `string`

#### Returns

[`OutliningSpan`](OutliningSpan.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10128

***

### getPasteEdits()

```ts
getPasteEdits(args, formatOptions): PasteEdits
```

#### Parameters

• **args**: [`PasteEditsArgs`](PasteEditsArgs.md)

• **formatOptions**: [`FormatCodeSettings`](FormatCodeSettings.md)

#### Returns

[`PasteEdits`](PasteEdits.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10178

***

### getProgram()

```ts
getProgram(): undefined | Program
```

#### Returns

`undefined` \| [`Program`](Program.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10171

***

### getQuickInfoAtPosition()

```ts
getQuickInfoAtPosition(fileName, position): undefined | QuickInfo
```

Gets semantic information about the identifier at a particular position in a
file. Quick info is what you typically see when you hover in an editor.

#### Parameters

• **fileName**: `string`

The path to the file

• **position**: `number`

A zero-based index of the character where you want the quick info

#### Returns

`undefined` \| [`QuickInfo`](QuickInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10102

***

### getReferencesAtPosition()

```ts
getReferencesAtPosition(fileName, position): undefined | ReferenceEntry[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| [`ReferenceEntry`](ReferenceEntry.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10117

***

### getRenameInfo()

#### getRenameInfo(fileName, position, preferences)

```ts
getRenameInfo(
   fileName, 
   position, 
   preferences): RenameInfo
```

##### Parameters

• **fileName**: `string`

• **position**: `number`

• **preferences**: [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

##### Returns

[`RenameInfo`](../type-aliases/RenameInfo.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10106

#### getRenameInfo(fileName, position, options)

```ts
getRenameInfo(
   fileName, 
   position, 
   options?): RenameInfo
```

##### Parameters

• **fileName**: `string`

• **position**: `number`

• **options?**: [`RenameInfoOptions`](RenameInfoOptions.md)

##### Returns

[`RenameInfo`](../type-aliases/RenameInfo.md)

##### Deprecated

Use the signature with `UserPreferences` instead.

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10108

***

### getSemanticClassifications()

#### getSemanticClassifications(fileName, span)

```ts
getSemanticClassifications(fileName, span): ClassifiedSpan[]
```

##### Parameters

• **fileName**: `string`

• **span**: [`TextSpan`](TextSpan.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[]

##### Deprecated

Use getEncodedSemanticClassifications instead.

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10058

#### getSemanticClassifications(fileName, span, format)

```ts
getSemanticClassifications(
   fileName, 
   span, 
   format): ClassifiedSpan[] | ClassifiedSpan2020[]
```

##### Parameters

• **fileName**: `string`

• **span**: [`TextSpan`](TextSpan.md)

• **format**: [`SemanticClassificationFormat`](../enumerations/SemanticClassificationFormat.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[] \| [`ClassifiedSpan2020`](ClassifiedSpan2020.md)[]

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10059

***

### getSemanticDiagnostics()

```ts
getSemanticDiagnostics(fileName): Diagnostic[]
```

Gets warnings or errors indicating type system issues in a given file.
Requesting semantic diagnostics may start up the type system and
run deferred work, so the first call may take longer than subsequent calls.

Unlike the other get*Diagnostics functions, these diagnostics can potentially not
include a reference to a source file. Specifically, the first time this is called,
it will return global diagnostics with no associated location.

To contrast the differences between semantic and syntactic diagnostics, consider the
sentence: "The sun is green." is syntactically correct; those are real English words with
correct sentence structure. However, it is semantically invalid, because it is not true.

#### Parameters

• **fileName**: `string`

A path to the file you want semantic diagnostics for

#### Returns

[`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10041

***

### getSignatureHelpItems()

```ts
getSignatureHelpItems(
   fileName, 
   position, 
   options): undefined | SignatureHelpItems
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **options**: `undefined` \| [`SignatureHelpItemsOptions`](SignatureHelpItemsOptions.md)

#### Returns

`undefined` \| [`SignatureHelpItems`](SignatureHelpItems.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10105

***

### getSmartSelectionRange()

```ts
getSmartSelectionRange(fileName, position): SelectionRange
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

[`SelectionRange`](SelectionRange.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10112

***

### getSpanOfEnclosingComment()

```ts
getSpanOfEnclosingComment(
   fileName, 
   position, 
   onlyMultiLine): undefined | TextSpan
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **onlyMultiLine**: `boolean`

#### Returns

`undefined` \| [`TextSpan`](TextSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10143

***

### getSuggestionDiagnostics()

```ts
getSuggestionDiagnostics(fileName): DiagnosticWithLocation[]
```

Gets suggestion diagnostics for a specific file. These diagnostics tend to
proactively suggest refactors, as opposed to diagnostics that indicate
potentially incorrect runtime behavior.

#### Parameters

• **fileName**: `string`

A path to the file you want semantic diagnostics for

#### Returns

[`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10049

***

### getSupportedCodeFixes()

```ts
getSupportedCodeFixes(fileName?): readonly string[]
```

#### Parameters

• **fileName?**: `string`

#### Returns

readonly `string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10176

***

### getSyntacticClassifications()

#### getSyntacticClassifications(fileName, span)

```ts
getSyntacticClassifications(fileName, span): ClassifiedSpan[]
```

##### Parameters

• **fileName**: `string`

• **span**: [`TextSpan`](TextSpan.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[]

##### Deprecated

Use getEncodedSyntacticClassifications instead.

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10055

#### getSyntacticClassifications(fileName, span, format)

```ts
getSyntacticClassifications(
   fileName, 
   span, 
   format): ClassifiedSpan[] | ClassifiedSpan2020[]
```

##### Parameters

• **fileName**: `string`

• **span**: [`TextSpan`](TextSpan.md)

• **format**: [`SemanticClassificationFormat`](../enumerations/SemanticClassificationFormat.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[] \| [`ClassifiedSpan2020`](ClassifiedSpan2020.md)[]

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10056

***

### getSyntacticDiagnostics()

```ts
getSyntacticDiagnostics(fileName): DiagnosticWithLocation[]
```

Gets errors indicating invalid syntax in a file.

In English, "this cdeo have, erorrs" is syntactically invalid because it has typos,
grammatical errors, and misplaced punctuation. Likewise, examples of syntax
errors in TypeScript are missing parentheses in an `if` statement, mismatched
curly braces, and using a reserved keyword as a variable name.

These diagnostics are inexpensive to compute and don't require knowledge of
other files. Note that a non-empty result increases the likelihood of false positives
from `getSemanticDiagnostics`.

While these represent the majority of syntax-related diagnostics, there are some
that require the type system, which will be present in `getSemanticDiagnostics`.

#### Parameters

• **fileName**: `string`

A path to the file you want syntactic diagnostics for

#### Returns

[`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10025

***

### getTodoComments()

```ts
getTodoComments(fileName, descriptors): TodoComment[]
```

#### Parameters

• **fileName**: `string`

• **descriptors**: [`TodoCommentDescriptor`](TodoCommentDescriptor.md)[]

#### Returns

[`TodoComment`](TodoComment.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10129

***

### getTypeDefinitionAtPosition()

```ts
getTypeDefinitionAtPosition(fileName, position): undefined | readonly DefinitionInfo[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| readonly [`DefinitionInfo`](DefinitionInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10115

***

### isValidBraceCompletionAtPosition()

```ts
isValidBraceCompletionAtPosition(
   fileName, 
   position, 
   openingBrace): boolean
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

• **openingBrace**: `number`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10136

***

### organizeImports()

```ts
organizeImports(
   args, 
   formatOptions, 
   preferences): readonly FileTextChanges[]
```

#### Parameters

• **args**: [`OrganizeImportsArgs`](OrganizeImportsArgs.md)

• **formatOptions**: [`FormatCodeSettings`](FormatCodeSettings.md)

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

#### Returns

readonly [`FileTextChanges`](FileTextChanges.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10168

***

### prepareCallHierarchy()

```ts
prepareCallHierarchy(fileName, position): undefined | CallHierarchyItem | CallHierarchyItem[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

`undefined` \| [`CallHierarchyItem`](CallHierarchyItem.md) \| [`CallHierarchyItem`](CallHierarchyItem.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10124

***

### provideCallHierarchyIncomingCalls()

```ts
provideCallHierarchyIncomingCalls(fileName, position): CallHierarchyIncomingCall[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

[`CallHierarchyIncomingCall`](CallHierarchyIncomingCall.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10125

***

### provideCallHierarchyOutgoingCalls()

```ts
provideCallHierarchyOutgoingCalls(fileName, position): CallHierarchyOutgoingCall[]
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

[`CallHierarchyOutgoingCall`](CallHierarchyOutgoingCall.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10126

***

### provideInlayHints()

```ts
provideInlayHints(
   fileName, 
   span, 
   preferences): InlayHint[]
```

#### Parameters

• **fileName**: `string`

• **span**: [`TextSpan`](TextSpan.md)

• **preferences**: `undefined` \| [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

#### Returns

[`InlayHint`](InlayHint.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10127

***

### toggleLineComment()

```ts
toggleLineComment(fileName, textRange): TextChange[]
```

#### Parameters

• **fileName**: `string`

• **textRange**: [`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10172

***

### toggleMultilineComment()

```ts
toggleMultilineComment(fileName, textRange): TextChange[]
```

#### Parameters

• **fileName**: `string`

• **textRange**: [`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10173

***

### toLineColumnOffset()?

```ts
optional toLineColumnOffset(fileName, position): LineAndCharacter
```

#### Parameters

• **fileName**: `string`

• **position**: `number`

#### Returns

[`LineAndCharacter`](LineAndCharacter.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10144

***

### uncommentSelection()

```ts
uncommentSelection(fileName, textRange): TextChange[]
```

#### Parameters

• **fileName**: `string`

• **textRange**: [`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10175
