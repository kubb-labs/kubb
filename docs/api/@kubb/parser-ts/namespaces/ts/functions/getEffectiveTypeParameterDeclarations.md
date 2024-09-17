[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getEffectiveTypeParameterDeclarations

# getEffectiveTypeParameterDeclarations()

```ts
function getEffectiveTypeParameterDeclarations(node): readonly TypeParameterDeclaration[]
```

Gets the effective type parameters. If the node was parsed in a
JavaScript file, gets the type parameters from the `@template` tag from JSDoc.

This does *not* return type parameters from a jsdoc reference to a generic type, eg

type Id = <T>(x: T) => T
/**

## Parameters

• **node**: [`DeclarationWithTypeParameters`](../type-aliases/DeclarationWithTypeParameters.md)

## Returns

readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8663
