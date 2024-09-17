[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / DocumentRegistry

# DocumentRegistry

The document registry represents a store of SourceFile objects that can be shared between
multiple LanguageService instances. A LanguageService instance holds on the SourceFile (AST)
of files in the context.
SourceFile objects account for most of the memory usage by the language service. Sharing
the same DocumentRegistry instance between different instances of LanguageService allow
for more efficient memory utilization since all projects will share at least the library
file (lib.d.ts).

A more advanced use of the document registry is to serialize sourceFile objects to disk
and re-hydrate them when needed.

To create a default DocumentRegistry, use createDocumentRegistry to create one, and pass it
to all subsequent createLanguageService calls.

## Methods

### acquireDocument()

```ts
acquireDocument(
   fileName, 
   compilationSettingsOrHost, 
   scriptSnapshot, 
   version, 
   scriptKind?, 
   sourceFileOptions?): SourceFile
```

Request a stored SourceFile with a given fileName and compilationSettings.
The first call to acquire will call createLanguageServiceSourceFile to generate
the SourceFile if was not found in the registry.

#### Parameters

• **fileName**: `string`

The name of the file requested

• **compilationSettingsOrHost**: [`CompilerOptions`](CompilerOptions.md) \| [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

Some compilation settings like target affects the
shape of a the resulting SourceFile. This allows the DocumentRegistry to store
multiple copies of the same file for different compilation settings. A minimal
resolution cache is needed to fully define a source file's shape when
the compilation settings include `module: node16`+, so providing a cache host
object should be preferred. A common host is a language service `ConfiguredProject`.

• **scriptSnapshot**: [`IScriptSnapshot`](IScriptSnapshot.md)

Text of the file. Only used if the file was not found
in the registry and a new one was created.

• **version**: `string`

Current version of the file. Only used if the file was not found
in the registry and a new one was created.

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

• **sourceFileOptions?**: [`ScriptTarget`](../enumerations/ScriptTarget.md) \| [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11233

***

### acquireDocumentWithKey()

```ts
acquireDocumentWithKey(
   fileName, 
   path, 
   compilationSettingsOrHost, 
   key, 
   scriptSnapshot, 
   version, 
   scriptKind?, 
   sourceFileOptions?): SourceFile
```

#### Parameters

• **fileName**: `string`

• **path**: [`Path`](../type-aliases/Path.md)

• **compilationSettingsOrHost**: [`CompilerOptions`](CompilerOptions.md) \| [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

• **key**: [`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

• **scriptSnapshot**: [`IScriptSnapshot`](IScriptSnapshot.md)

• **version**: `string`

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

• **sourceFileOptions?**: [`ScriptTarget`](../enumerations/ScriptTarget.md) \| [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11234

***

### getKeyForCompilationSettings()

```ts
getKeyForCompilationSettings(settings): DocumentRegistryBucketKey
```

#### Parameters

• **settings**: [`CompilerOptions`](CompilerOptions.md)

#### Returns

[`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11252

***

### releaseDocument()

#### releaseDocument(fileName, compilationSettings, scriptKind)

```ts
releaseDocument(
   fileName, 
   compilationSettings, 
   scriptKind?): void
```

Informs the DocumentRegistry that a file is not needed any longer.

Note: It is not allowed to call release on a SourceFile that was not acquired from
this registry originally.

##### Parameters

• **fileName**: `string`

The name of the file to be released

• **compilationSettings**: [`CompilerOptions`](CompilerOptions.md)

The compilation settings used to acquire the file

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

The script kind of the file to be released

##### Returns

`void`

##### Deprecated

pass scriptKind and impliedNodeFormat for correctness

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11265

#### releaseDocument(fileName, compilationSettings, scriptKind, impliedNodeFormat)

```ts
releaseDocument(
   fileName, 
   compilationSettings, 
   scriptKind, 
   impliedNodeFormat): void
```

Informs the DocumentRegistry that a file is not needed any longer.

Note: It is not allowed to call release on a SourceFile that was not acquired from
this registry originally.

##### Parameters

• **fileName**: `string`

The name of the file to be released

• **compilationSettings**: [`CompilerOptions`](CompilerOptions.md)

The compilation settings used to acquire the file

• **scriptKind**: [`ScriptKind`](../enumerations/ScriptKind.md)

The script kind of the file to be released

• **impliedNodeFormat**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

The implied source file format of the file to be released

##### Returns

`void`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11277

***

### releaseDocumentWithKey()

#### releaseDocumentWithKey(path, key, scriptKind)

```ts
releaseDocumentWithKey(
   path, 
   key, 
   scriptKind?): void
```

##### Parameters

• **path**: [`Path`](../type-aliases/Path.md)

• **key**: [`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

##### Returns

`void`

##### Deprecated

pass scriptKind for and impliedNodeFormat correctness

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11280

#### releaseDocumentWithKey(path, key, scriptKind, impliedNodeFormat)

```ts
releaseDocumentWithKey(
   path, 
   key, 
   scriptKind, 
   impliedNodeFormat): void
```

##### Parameters

• **path**: [`Path`](../type-aliases/Path.md)

• **key**: [`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

• **scriptKind**: [`ScriptKind`](../enumerations/ScriptKind.md)

• **impliedNodeFormat**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

##### Returns

`void`

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11281

***

### reportStats()

```ts
reportStats(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11282

***

### updateDocument()

```ts
updateDocument(
   fileName, 
   compilationSettingsOrHost, 
   scriptSnapshot, 
   version, 
   scriptKind?, 
   sourceFileOptions?): SourceFile
```

Request an updated version of an already existing SourceFile with a given fileName
and compilationSettings. The update will in-turn call updateLanguageServiceSourceFile
to get an updated SourceFile.

#### Parameters

• **fileName**: `string`

The name of the file requested

• **compilationSettingsOrHost**: [`CompilerOptions`](CompilerOptions.md) \| [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

Some compilation settings like target affects the
shape of a the resulting SourceFile. This allows the DocumentRegistry to store
multiple copies of the same file for different compilation settings. A minimal
resolution cache is needed to fully define a source file's shape when
the compilation settings include `module: node16`+, so providing a cache host
object should be preferred. A common host is a language service `ConfiguredProject`.

• **scriptSnapshot**: [`IScriptSnapshot`](IScriptSnapshot.md)

Text of the file.

• **version**: `string`

Current version of the file.

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

• **sourceFileOptions?**: [`ScriptTarget`](../enumerations/ScriptTarget.md) \| [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11250

***

### updateDocumentWithKey()

```ts
updateDocumentWithKey(
   fileName, 
   path, 
   compilationSettingsOrHost, 
   key, 
   scriptSnapshot, 
   version, 
   scriptKind?, 
   sourceFileOptions?): SourceFile
```

#### Parameters

• **fileName**: `string`

• **path**: [`Path`](../type-aliases/Path.md)

• **compilationSettingsOrHost**: [`CompilerOptions`](CompilerOptions.md) \| [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

• **key**: [`DocumentRegistryBucketKey`](../type-aliases/DocumentRegistryBucketKey.md)

• **scriptSnapshot**: [`IScriptSnapshot`](IScriptSnapshot.md)

• **version**: `string`

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

• **sourceFileOptions?**: [`ScriptTarget`](../enumerations/ScriptTarget.md) \| [`CreateSourceFileOptions`](CreateSourceFileOptions.md)

#### Returns

[`SourceFile`](SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11251
