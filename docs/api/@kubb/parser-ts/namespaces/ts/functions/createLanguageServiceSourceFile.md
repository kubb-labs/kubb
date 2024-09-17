[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createLanguageServiceSourceFile

# createLanguageServiceSourceFile()

```ts
function createLanguageServiceSourceFile(
   fileName, 
   scriptSnapshot, 
   scriptTargetOrOptions, 
   version, 
   setNodeParents, 
   scriptKind?): SourceFile
```

## Parameters

• **fileName**: `string`

• **scriptSnapshot**: [`IScriptSnapshot`](../interfaces/IScriptSnapshot.md)

• **scriptTargetOrOptions**: [`ScriptTarget`](../enumerations/ScriptTarget.md) \| [`CreateSourceFileOptions`](../interfaces/CreateSourceFileOptions.md)

• **version**: `string`

• **setNodeParents**: `boolean`

• **scriptKind?**: [`ScriptKind`](../enumerations/ScriptKind.md)

## Returns

[`SourceFile`](../interfaces/SourceFile.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11309
