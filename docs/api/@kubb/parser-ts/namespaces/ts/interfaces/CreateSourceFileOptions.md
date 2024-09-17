[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CreateSourceFileOptions

# CreateSourceFileOptions

## Properties

### impliedNodeFormat?

```ts
optional impliedNodeFormat: ResolutionMode;
```

Controls the format the file is detected as - this can be derived from only the path
and files on disk, but needs to be done with a module resolution cache in scope to be performant.
This is usually `undefined` for compilations that do not have `moduleResolution` values of `node16` or `nodenext`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9113

***

### jsDocParsingMode?

```ts
optional jsDocParsingMode: JSDocParsingMode;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9120

***

### languageVersion

```ts
languageVersion: ScriptTarget;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9107

***

### setExternalModuleIndicator()?

```ts
optional setExternalModuleIndicator: (file) => void;
```

Controls how module-y-ness is set for the given file. Usually the result of calling
`getSetExternalModuleIndicator` on a valid `CompilerOptions` object. If not present, the default
check specified by `isFileProbablyExternalModule` will be used to set the field.

#### Parameters

• **file**: [`SourceFile`](SourceFile.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9119
