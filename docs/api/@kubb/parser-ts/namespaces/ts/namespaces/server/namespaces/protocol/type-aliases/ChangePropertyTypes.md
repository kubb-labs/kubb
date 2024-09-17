[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ChangePropertyTypes

# ChangePropertyTypes\<T, Substitutions\>

```ts
type ChangePropertyTypes<T, Substitutions>: { [K in keyof T]: K extends keyof Substitutions ? Substitutions[K] : T[K] };
```

## Type Parameters

• **T**

• **Substitutions** *extends* `{ [K in keyof T]?: any }`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:38
