[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OasTypes](../index.md) / KeyedSecuritySchemeObject

# KeyedSecuritySchemeObject

```ts
type KeyedSecuritySchemeObject: SecuritySchemeObject & object;
```

## Type declaration

### \_key

```ts
_key: string;
```

The key for the given security scheme object

### \_requirements?

```ts
optional _requirements: string[];
```

An array of required scopes for the given security scheme object.
Used for `oauth2` security scheme types.

### x-default?

```ts
optional x-default: number | string;
```

## Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/types.d.ts:164
