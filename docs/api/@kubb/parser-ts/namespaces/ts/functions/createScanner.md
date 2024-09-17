[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createScanner

# createScanner()

```ts
function createScanner(
   languageVersion, 
   skipTrivia, 
   languageVariant?, 
   textInitial?, 
   onError?, 
   start?, 
   length?): Scanner
```

## Parameters

• **languageVersion**: [`ScriptTarget`](../enumerations/ScriptTarget.md)

• **skipTrivia**: `boolean`

• **languageVariant?**: [`LanguageVariant`](../enumerations/LanguageVariant.md)

• **textInitial?**: `string`

• **onError?**: [`ErrorCallback`](../type-aliases/ErrorCallback.md)

• **start?**: `number`

• **length?**: `number`

## Returns

[`Scanner`](../interfaces/Scanner.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8417
