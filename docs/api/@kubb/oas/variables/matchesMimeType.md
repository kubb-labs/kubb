[API](../../../packages.md) / [@kubb/oas](../index.md) / matchesMimeType

# matchesMimeType

```ts
const matchesMimeType: object;
```

## Type declaration

### formUrlEncoded()

```ts
formUrlEncoded: (mimeType) => boolean;
```

#### Parameters

• **mimeType**: `string`

#### Returns

`boolean`

### json()

```ts
json: (contentType) => boolean;
```

#### Parameters

• **contentType**: `string`

#### Returns

`boolean`

### multipart()

```ts
multipart: (contentType) => boolean;
```

#### Parameters

• **contentType**: `string`

#### Returns

`boolean`

### wildcard()

```ts
wildcard: (contentType) => boolean;
```

#### Parameters

• **contentType**: `string`

#### Returns

`boolean`

### xml()

```ts
xml: (contentType) => boolean;
```

#### Parameters

• **contentType**: `string`

#### Returns

`boolean`

## Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/utils.d.ts:15
