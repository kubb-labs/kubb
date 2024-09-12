[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OasTypes](../index.md) / SecurityType

# SecurityType

```ts
type SecurityType: 
  | "apiKey"
  | "Basic"
  | "Bearer"
  | "Cookie"
  | "Header"
  | "http"
  | "OAuth2"
  | "Query";
```

The type of security scheme. Used by `operation.getSecurityWithTypes()` and `operation.prepareSecurity()`.

## Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/types.d.ts:44
