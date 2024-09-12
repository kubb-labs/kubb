[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3](../index.md) / OAuth2SecurityScheme

# OAuth2SecurityScheme

## Properties

### description?

```ts
optional description: string;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:429

***

### flows

```ts
flows: object;
```

#### authorizationCode?

```ts
optional authorizationCode: object;
```

#### authorizationCode.authorizationUrl

```ts
authorizationCode.authorizationUrl: string;
```

#### authorizationCode.refreshUrl?

```ts
optional authorizationCode.refreshUrl: string;
```

#### authorizationCode.scopes

```ts
authorizationCode.scopes: object;
```

##### Index Signature

 \[`scope`: `string`\]: `string`

#### authorizationCode.tokenUrl

```ts
authorizationCode.tokenUrl: string;
```

#### clientCredentials?

```ts
optional clientCredentials: object;
```

#### clientCredentials.refreshUrl?

```ts
optional clientCredentials.refreshUrl: string;
```

#### clientCredentials.scopes

```ts
clientCredentials.scopes: object;
```

##### Index Signature

 \[`scope`: `string`\]: `string`

#### clientCredentials.tokenUrl

```ts
clientCredentials.tokenUrl: string;
```

#### implicit?

```ts
optional implicit: object;
```

#### implicit.authorizationUrl

```ts
implicit.authorizationUrl: string;
```

#### implicit.refreshUrl?

```ts
optional implicit.refreshUrl: string;
```

#### implicit.scopes

```ts
implicit.scopes: object;
```

##### Index Signature

 \[`scope`: `string`\]: `string`

#### password?

```ts
optional password: object;
```

#### password.refreshUrl?

```ts
optional password.refreshUrl: string;
```

#### password.scopes

```ts
password.scopes: object;
```

##### Index Signature

 \[`scope`: `string`\]: `string`

#### password.tokenUrl

```ts
password.tokenUrl: string;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:430

***

### type

```ts
type: "oauth2";
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:428
