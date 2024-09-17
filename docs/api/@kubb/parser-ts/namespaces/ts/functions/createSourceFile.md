[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createSourceFile

# createSourceFile()

```ts
function createSourceFile(
   fileName, 
   sourceText, 
   languageVersionOrOptions, 
   setParentNodes?, 
   scriptKind?): SourceFile
```

## Parameters

• **fileName**: `string`

• **sourceText**: `string`

• **languageVersionOrOptions**: [`ScriptTarget`](../enumerations/ScriptTarget.md) \| [`CreateSourceFileOptions`](../interfaces/CreateSourceFileOptions.md)

• **setParentNodes?**: `boolean`

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

## Returns

[`SourceFile`](../interfaces/SourceFile.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9096
