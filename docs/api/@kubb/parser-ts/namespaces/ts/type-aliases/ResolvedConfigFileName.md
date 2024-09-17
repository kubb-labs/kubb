[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ResolvedConfigFileName

# ResolvedConfigFileName

```ts
type ResolvedConfigFileName: string & object;
```

Branded string for keeping track of when we've turned an ambiguous path
specified like "./blah" to an absolute path to an actual
tsconfig file, e.g. "/root/blah/tsconfig.json"

## Type declaration

### \_isResolvedConfigFileName

```ts
_isResolvedConfigFileName: never;
```

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5938
