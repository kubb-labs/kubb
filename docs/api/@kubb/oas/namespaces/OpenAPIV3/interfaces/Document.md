[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3](../index.md) / Document

# Document\<T\>

## Type Parameters

• **T** *extends* `object` = `object`

## Properties

### components?

```ts
optional components: ComponentsObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:158

***

### externalDocs?

```ts
optional externalDocs: ExternalDocumentationObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:161

***

### info

```ts
info: InfoObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:155

***

### openapi

```ts
openapi: string;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:154

***

### paths

```ts
paths: PathsObject<T, object>;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:157

***

### security?

```ts
optional security: SecurityRequirementObject[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:159

***

### servers?

```ts
optional servers: ServerObject[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:156

***

### tags?

```ts
optional tags: TagObject[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:160

***

### x-express-openapi-additional-middleware?

```ts
optional x-express-openapi-additional-middleware: ((request, response, next) => Promise<void> | (request, response, next) => void)[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:162

***

### x-express-openapi-validation-strict?

```ts
optional x-express-openapi-validation-strict: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:163
