[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ChangeStringIndexSignature

# ChangeStringIndexSignature\<T, NewStringIndexSignatureType\>

```ts
type ChangeStringIndexSignature<T, NewStringIndexSignatureType>: { [K in keyof T]: string extends K ? NewStringIndexSignatureType : T[K] };
```

## Type Parameters

• **T**

• **NewStringIndexSignatureType**

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:46
