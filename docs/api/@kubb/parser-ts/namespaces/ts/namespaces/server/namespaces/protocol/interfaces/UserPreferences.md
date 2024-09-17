[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / UserPreferences

# UserPreferences

## Extended by

- [`GetCompletionsAtPositionOptions`](../../../../../interfaces/GetCompletionsAtPositionOptions.md)

## Properties

### allowIncompleteCompletions?

```ts
readonly optional allowIncompleteCompletions: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8246

***

### allowRenameOfImportPath?

```ts
readonly optional allowRenameOfImportPath: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8264

***

### allowTextChangesInNewFiles?

```ts
readonly optional allowTextChangesInNewFiles: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8250

***

### autoImportFileExcludePatterns?

```ts
readonly optional autoImportFileExcludePatterns: string[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8265

***

### autoImportSpecifierExcludeRegexes?

```ts
readonly optional autoImportSpecifierExcludeRegexes: string[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8266

***

### disableLineTextInReferences?

```ts
readonly optional disableLineTextInReferences: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8335

***

### disableSuggestions?

```ts
readonly optional disableSuggestions: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8200

***

### displayPartsForJSDoc?

```ts
readonly optional displayPartsForJSDoc: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8333

***

### excludeLibrarySymbolsInNavTo?

```ts
readonly optional excludeLibrarySymbolsInNavTo: boolean;
```

Indicates whether to exclude standard library and node_modules file symbols from navTo results.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8331

***

### generateReturnInDocTemplate?

```ts
readonly optional generateReturnInDocTemplate: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8334

***

### importModuleSpecifierEnding?

```ts
readonly optional importModuleSpecifierEnding: "index" | "js" | "auto" | "minimal";
```

Determines whether we import `foo/index.ts` as "foo", "foo/index", or "foo/index.js"

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8249

***

### importModuleSpecifierPreference?

```ts
readonly optional importModuleSpecifierPreference: "shortest" | "project-relative" | "relative" | "non-relative";
```

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8221

***

### includeCompletionsForImportStatements?

```ts
readonly optional includeCompletionsForImportStatements: boolean;
```

Enables auto-import-style completions on partially-typed import statements. E.g., allows
`import write|` to be completed to `import { writeFile } from "fs"`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8211

***

### includeCompletionsForModuleExports?

```ts
readonly optional includeCompletionsForModuleExports: boolean;
```

If enabled, TypeScript will search through all external modules' exports and add them to the completions list.
This affects lone identifier completions but not completions on the right hand side of `obj.`.

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8233

***

### includeCompletionsWithInsertText?

```ts
readonly optional includeCompletionsWithInsertText: boolean;
```

If enabled, the completion list will include completions with invalid identifier names.
For those entries, The `insertText` and `replacementSpan` properties will be set to change from `.x` property access to `["x"]`.

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8240

***

### includeCompletionsWithSnippetText?

```ts
readonly optional includeCompletionsWithSnippetText: boolean;
```

Allows completions to be formatted with snippet text, indicated by `CompletionItem["isSnippet"]`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8215

***

### includeInlayEnumMemberValueHints?

```ts
readonly optional includeInlayEnumMemberValueHints: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8262

***

### includeInlayFunctionLikeReturnTypeHints?

```ts
readonly optional includeInlayFunctionLikeReturnTypeHints: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8261

***

### includeInlayFunctionParameterTypeHints?

```ts
readonly optional includeInlayFunctionParameterTypeHints: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8257

***

### includeInlayParameterNameHints?

```ts
readonly optional includeInlayParameterNameHints: "all" | "none" | "literals";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8255

***

### includeInlayParameterNameHintsWhenArgumentMatchesName?

```ts
readonly optional includeInlayParameterNameHintsWhenArgumentMatchesName: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8256

***

### includeInlayPropertyDeclarationTypeHints?

```ts
readonly optional includeInlayPropertyDeclarationTypeHints: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8260

***

### includeInlayVariableTypeHints?

```ts
readonly optional includeInlayVariableTypeHints: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8258

***

### includeInlayVariableTypeHintsWhenTypeMatchesName?

```ts
readonly optional includeInlayVariableTypeHintsWhenTypeMatchesName: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8259

***

### includePackageJsonAutoImports?

```ts
readonly optional includePackageJsonAutoImports: "auto" | "on" | "off";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8252

***

### interactiveInlayHints?

```ts
readonly optional interactiveInlayHints: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8263

***

### jsxAttributeCompletionStyle?

```ts
readonly optional jsxAttributeCompletionStyle: "auto" | "braces" | "none";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8254

***

### lazyConfiguredProjectsFromExternalProject?

```ts
readonly optional lazyConfiguredProjectsFromExternalProject: boolean;
```

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

This preference is ignored if [organizeImportsCollation](UserPreferences.md#organizeimportscollation) is not `"unicode"`.

Default: `true`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8308

***

### organizeImportsCaseFirst?

```ts
readonly optional organizeImportsCaseFirst: false | "upper" | "lower";
```

Indicates whether upper case or lower case should sort first. When `false`, the default order for the locale
specified in organizeImportsCollationLocale is used.

This preference is ignored if [organizeImportsCollation](UserPreferences.md#organizeimportscollation) is not `"unicode"`. This preference is also
ignored if we are using case-insensitive sorting, which occurs when [organizeImportsIgnoreCase](UserPreferences.md#organizeimportsignorecase) is `true`,
or if [organizeImportsIgnoreCase](UserPreferences.md#organizeimportsignorecase) is `"auto"` and the auto-detected case sensitivity is determined to be
case-insensitive.

Default: `false`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8280

***

### organizeImportsIgnoreCase?

```ts
readonly optional organizeImportsIgnoreCase: boolean | "auto";
```

Indicates whether imports should be organized in a case-insensitive manner.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8271

***

### organizeImportsLocale?

```ts
readonly optional organizeImportsLocale: string;
```

Indicates the locale to use for "unicode" collation. If not specified, the locale `"en"` is used as an invariant
for the sake of consistent sorting. Use `"auto"` to use the detected UI locale.

This preference is ignored if [organizeImportsCollation](UserPreferences.md#organizeimportscollation) is not `"unicode"`.

Default: `"en"`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8289

***

### organizeImportsNumericCollation?

```ts
readonly optional organizeImportsNumericCollation: boolean;
```

Indicates whether numeric collation should be used for digit sequences in strings. When `true`, will collate
strings such that `a1z < a2z < a100z`. When `false`, will collate strings such that `a1z < a100z < a2z`.

This preference is ignored if [organizeImportsCollation](UserPreferences.md#organizeimportscollation) is not `"unicode"`.

Default: `false`

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8327

***

### preferTypeOnlyAutoImports?

```ts
readonly optional preferTypeOnlyAutoImports: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8267

***

### providePrefixAndSuffixTextForRename?

```ts
readonly optional providePrefixAndSuffixTextForRename: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8251

***

### provideRefactorNotApplicableReason?

```ts
readonly optional provideRefactorNotApplicableReason: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8253

***

### quotePreference?

```ts
readonly optional quotePreference: "auto" | "double" | "single";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8201

***

### useLabelDetailsInCompletionEntries?

```ts
readonly optional useLabelDetailsInCompletionEntries: boolean;
```

Indicates whether [completion entry label details](../../../../../interfaces/CompletionEntry.md#labeldetails) are supported.
If not, contents of `labelDetails` may be included in the [CompletionEntry.name](../../../../../interfaces/CompletionEntry.md#name) property.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8245
