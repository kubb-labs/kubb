[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / GetCompletionsAtPositionOptions

# GetCompletionsAtPositionOptions

## Extends

- [`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md)

## Properties

### allowIncompleteCompletions?

```ts
readonly optional allowIncompleteCompletions: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`allowIncompleteCompletions`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#allowincompletecompletions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8246

***

### allowRenameOfImportPath?

```ts
readonly optional allowRenameOfImportPath: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`allowRenameOfImportPath`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#allowrenameofimportpath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8264

***

### allowTextChangesInNewFiles?

```ts
readonly optional allowTextChangesInNewFiles: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`allowTextChangesInNewFiles`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#allowtextchangesinnewfiles)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8250

***

### autoImportFileExcludePatterns?

```ts
readonly optional autoImportFileExcludePatterns: string[];
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`autoImportFileExcludePatterns`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#autoimportfileexcludepatterns)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8265

***

### autoImportSpecifierExcludeRegexes?

```ts
readonly optional autoImportSpecifierExcludeRegexes: string[];
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`autoImportSpecifierExcludeRegexes`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#autoimportspecifierexcluderegexes)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8266

***

### disableLineTextInReferences?

```ts
readonly optional disableLineTextInReferences: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`disableLineTextInReferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#disablelinetextinreferences)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8335

***

### disableSuggestions?

```ts
readonly optional disableSuggestions: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`disableSuggestions`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#disablesuggestions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8200

***

### displayPartsForJSDoc?

```ts
readonly optional displayPartsForJSDoc: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`displayPartsForJSDoc`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#displaypartsforjsdoc)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8333

***

### excludeLibrarySymbolsInNavTo?

```ts
readonly optional excludeLibrarySymbolsInNavTo: boolean;
```

Indicates whether to exclude standard library and node_modules file symbols from navTo results.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`excludeLibrarySymbolsInNavTo`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#excludelibrarysymbolsinnavto)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8331

***

### generateReturnInDocTemplate?

```ts
readonly optional generateReturnInDocTemplate: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`generateReturnInDocTemplate`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#generatereturnindoctemplate)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8334

***

### importModuleSpecifierEnding?

```ts
readonly optional importModuleSpecifierEnding: "index" | "js" | "auto" | "minimal";
```

Determines whether we import `foo/index.ts` as "foo", "foo/index", or "foo/index.js"

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`importModuleSpecifierEnding`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#importmodulespecifierending)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8249

***

### importModuleSpecifierPreference?

```ts
readonly optional importModuleSpecifierPreference: "shortest" | "project-relative" | "relative" | "non-relative";
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`importModuleSpecifierPreference`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#importmodulespecifierpreference)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8247

***

### includeAutomaticOptionalChainCompletions?

```ts
readonly optional includeAutomaticOptionalChainCompletions: boolean;
```

Unless this option is `false`, or `includeCompletionsWithInsertText` is not enabled,
member completion lists triggered with `.` will include entries on potentially-null and potentially-undefined
values, with insertion text to replace preceding `.` tokens with `?.`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeAutomaticOptionalChainCompletions`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeautomaticoptionalchaincompletions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8221

***

### includeCompletionsForImportStatements?

```ts
readonly optional includeCompletionsForImportStatements: boolean;
```

Enables auto-import-style completions on partially-typed import statements. E.g., allows
`import write|` to be completed to `import { writeFile } from "fs"`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeCompletionsForImportStatements`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includecompletionsforimportstatements)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8211

***

### includeCompletionsForModuleExports?

```ts
readonly optional includeCompletionsForModuleExports: boolean;
```

If enabled, TypeScript will search through all external modules' exports and add them to the completions list.
This affects lone identifier completions but not completions on the right hand side of `obj.`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeCompletionsForModuleExports`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includecompletionsformoduleexports)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8206

***

### includeCompletionsWithClassMemberSnippets?

```ts
readonly optional includeCompletionsWithClassMemberSnippets: boolean;
```

If enabled, completions for class members (e.g. methods and properties) will include
a whole declaration for the member.
E.g., `class A { f| }` could be completed to `class A { foo(): number {} }`, instead of
`class A { foo }`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeCompletionsWithClassMemberSnippets`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includecompletionswithclassmembersnippets)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8233

***

### includeCompletionsWithInsertText?

```ts
readonly optional includeCompletionsWithInsertText: boolean;
```

If enabled, the completion list will include completions with invalid identifier names.
For those entries, The `insertText` and `replacementSpan` properties will be set to change from `.x` property access to `["x"]`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeCompletionsWithInsertText`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includecompletionswithinserttext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8226

***

### includeCompletionsWithObjectLiteralMethodSnippets?

```ts
readonly optional includeCompletionsWithObjectLiteralMethodSnippets: boolean;
```

If enabled, object literal methods will have a method declaration completion entry in addition
to the regular completion entry containing just the method name.
E.g., `const objectLiteral: T = { f| }` could be completed to `const objectLiteral: T = { foo(): void {} }`,
in addition to `const objectLiteral: T = { foo }`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeCompletionsWithObjectLiteralMethodSnippets`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includecompletionswithobjectliteralmethodsnippets)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8240

***

### includeCompletionsWithSnippetText?

```ts
readonly optional includeCompletionsWithSnippetText: boolean;
```

Allows completions to be formatted with snippet text, indicated by `CompletionItem["isSnippet"]`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeCompletionsWithSnippetText`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includecompletionswithsnippettext)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8215

***

### ~~includeExternalModuleExports?~~

```ts
optional includeExternalModuleExports: boolean;
```

#### Deprecated

Use includeCompletionsForModuleExports

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10239

***

### includeInlayEnumMemberValueHints?

```ts
readonly optional includeInlayEnumMemberValueHints: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayEnumMemberValueHints`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlayenummembervaluehints)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8262

***

### includeInlayFunctionLikeReturnTypeHints?

```ts
readonly optional includeInlayFunctionLikeReturnTypeHints: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayFunctionLikeReturnTypeHints`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlayfunctionlikereturntypehints)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8261

***

### includeInlayFunctionParameterTypeHints?

```ts
readonly optional includeInlayFunctionParameterTypeHints: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayFunctionParameterTypeHints`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlayfunctionparametertypehints)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8257

***

### includeInlayParameterNameHints?

```ts
readonly optional includeInlayParameterNameHints: "all" | "none" | "literals";
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayParameterNameHints`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlayparameternamehints)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8255

***

### includeInlayParameterNameHintsWhenArgumentMatchesName?

```ts
readonly optional includeInlayParameterNameHintsWhenArgumentMatchesName: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayParameterNameHintsWhenArgumentMatchesName`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlayparameternamehintswhenargumentmatchesname)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8256

***

### includeInlayPropertyDeclarationTypeHints?

```ts
readonly optional includeInlayPropertyDeclarationTypeHints: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayPropertyDeclarationTypeHints`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlaypropertydeclarationtypehints)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8260

***

### includeInlayVariableTypeHints?

```ts
readonly optional includeInlayVariableTypeHints: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayVariableTypeHints`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlayvariabletypehints)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8258

***

### includeInlayVariableTypeHintsWhenTypeMatchesName?

```ts
readonly optional includeInlayVariableTypeHintsWhenTypeMatchesName: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includeInlayVariableTypeHintsWhenTypeMatchesName`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includeinlayvariabletypehintswhentypematchesname)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8259

***

### ~~includeInsertTextCompletions?~~

```ts
optional includeInsertTextCompletions: boolean;
```

#### Deprecated

Use includeCompletionsWithInsertText

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10241

***

### includePackageJsonAutoImports?

```ts
readonly optional includePackageJsonAutoImports: "auto" | "on" | "off";
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`includePackageJsonAutoImports`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#includepackagejsonautoimports)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8252

***

### includeSymbol?

```ts
optional includeSymbol: boolean;
```

Include a `symbol` property on each completion entry object.
Symbols reference cyclic data structures and sometimes an entire TypeChecker instance,
so use caution when serializing or retaining completion entries retrieved with this option.

#### Default

```ts
false
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10237

***

### interactiveInlayHints?

```ts
readonly optional interactiveInlayHints: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`interactiveInlayHints`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#interactiveinlayhints)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8263

***

### jsxAttributeCompletionStyle?

```ts
readonly optional jsxAttributeCompletionStyle: "auto" | "braces" | "none";
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`jsxAttributeCompletionStyle`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#jsxattributecompletionstyle)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8254

***

### lazyConfiguredProjectsFromExternalProject?

```ts
readonly optional lazyConfiguredProjectsFromExternalProject: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`lazyConfiguredProjectsFromExternalProject`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#lazyconfiguredprojectsfromexternalproject)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8332

***

### organizeImportsAccentCollation?

```ts
readonly optional organizeImportsAccentCollation: boolean;
```

Indicates whether accents and other diacritic marks are considered unequal for the purpose of collation. When
`true`, characters with accents and other diacritics will be collated in the order defined by the locale specified
in organizeImportsCollationLocale.

This preference is ignored if [organizeImportsCollation](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportscollation) is not `"unicode"`.

Default: `true`

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`organizeImportsAccentCollation`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportsaccentcollation)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8308

***

### organizeImportsCaseFirst?

```ts
readonly optional organizeImportsCaseFirst: false | "upper" | "lower";
```

Indicates whether upper case or lower case should sort first. When `false`, the default order for the locale
specified in organizeImportsCollationLocale is used.

This preference is ignored if [organizeImportsCollation](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportscollation) is not `"unicode"`. This preference is also
ignored if we are using case-insensitive sorting, which occurs when [organizeImportsIgnoreCase](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportsignorecase) is `true`,
or if [organizeImportsIgnoreCase](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportsignorecase) is `"auto"` and the auto-detected case sensitivity is determined to be
case-insensitive.

Default: `false`

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`organizeImportsCaseFirst`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportscasefirst)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8320

***

### organizeImportsCollation?

```ts
readonly optional organizeImportsCollation: "ordinal" | "unicode";
```

Indicates whether imports should be organized via an "ordinal" (binary) comparison using the numeric value
of their code points, or via "unicode" collation (via the
[Unicode Collation Algorithm](https://unicode.org/reports/tr10/#Scope)) using rules associated with the locale
specified in organizeImportsCollationLocale.

Default: `"ordinal"`.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`organizeImportsCollation`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportscollation)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8280

***

### organizeImportsIgnoreCase?

```ts
readonly optional organizeImportsIgnoreCase: boolean | "auto";
```

Indicates whether imports should be organized in a case-insensitive manner.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`organizeImportsIgnoreCase`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportsignorecase)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8271

***

### organizeImportsLocale?

```ts
readonly optional organizeImportsLocale: string;
```

Indicates the locale to use for "unicode" collation. If not specified, the locale `"en"` is used as an invariant
for the sake of consistent sorting. Use `"auto"` to use the detected UI locale.

This preference is ignored if [organizeImportsCollation](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportscollation) is not `"unicode"`.

Default: `"en"`

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`organizeImportsLocale`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportslocale)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8289

***

### organizeImportsNumericCollation?

```ts
readonly optional organizeImportsNumericCollation: boolean;
```

Indicates whether numeric collation should be used for digit sequences in strings. When `true`, will collate
strings such that `a1z < a2z < a100z`. When `false`, will collate strings such that `a1z < a100z < a2z`.

This preference is ignored if [organizeImportsCollation](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportscollation) is not `"unicode"`.

Default: `false`

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`organizeImportsNumericCollation`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportsnumericcollation)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8298

***

### organizeImportsTypeOrder?

```ts
readonly optional organizeImportsTypeOrder: OrganizeImportsTypeOrder;
```

Indicates where named type-only imports should sort. "inline" sorts named imports without regard to if the import is
type-only.

Default: `last`

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`organizeImportsTypeOrder`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#organizeimportstypeorder)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8327

***

### preferTypeOnlyAutoImports?

```ts
readonly optional preferTypeOnlyAutoImports: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`preferTypeOnlyAutoImports`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#prefertypeonlyautoimports)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8267

***

### providePrefixAndSuffixTextForRename?

```ts
readonly optional providePrefixAndSuffixTextForRename: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`providePrefixAndSuffixTextForRename`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#provideprefixandsuffixtextforrename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8251

***

### provideRefactorNotApplicableReason?

```ts
readonly optional provideRefactorNotApplicableReason: boolean;
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`provideRefactorNotApplicableReason`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#providerefactornotapplicablereason)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8253

***

### quotePreference?

```ts
readonly optional quotePreference: "auto" | "double" | "single";
```

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`quotePreference`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#quotepreference)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8201

***

### triggerCharacter?

```ts
optional triggerCharacter: CompletionsTriggerCharacter;
```

If the editor is asking for completions because a certain character was typed
(as opposed to when the user explicitly requested them) this should be set.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10229

***

### triggerKind?

```ts
optional triggerKind: CompletionTriggerKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10230

***

### useLabelDetailsInCompletionEntries?

```ts
readonly optional useLabelDetailsInCompletionEntries: boolean;
```

Indicates whether [completion entry label details](CompletionEntry.md#labeldetails) are supported.
If not, contents of `labelDetails` may be included in the [CompletionEntry.name](CompletionEntry.md#name) property.

#### Inherited from

[`UserPreferences`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md).[`useLabelDetailsInCompletionEntries`](../namespaces/server/namespaces/protocol/interfaces/UserPreferences.md#uselabeldetailsincompletionentries)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8245
