[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3](../index.md) / BaseSchemaObject

# BaseSchemaObject

## Extended by

- [`ArraySchemaObject`](ArraySchemaObject.md)
- [`NonArraySchemaObject`](NonArraySchemaObject.md)

## Properties

### additionalProperties?

```ts
optional additionalProperties: boolean | ReferenceObject | SchemaObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:282

***

### allOf?

```ts
optional allOf: (ReferenceObject | SchemaObject)[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:293

***

### anyOf?

```ts
optional anyOf: (ReferenceObject | SchemaObject)[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:295

***

### default?

```ts
optional default: any;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:273

***

### deprecated?

```ts
optional deprecated: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:304

***

### description?

```ts
optional description: string;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:271

***

### discriminator?

```ts
optional discriminator: DiscriminatorObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:298

***

### enum?

```ts
optional enum: any[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:289

***

### example?

```ts
optional example: any;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:303

***

### exclusiveMaximum?

```ts
optional exclusiveMaximum: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:276

***

### exclusiveMinimum?

```ts
optional exclusiveMinimum: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:278

***

### externalDocs?

```ts
optional externalDocs: ExternalDocumentationObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:302

***

### format?

```ts
optional format: string;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:272

***

### maximum?

```ts
optional maximum: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:275

***

### maxItems?

```ts
optional maxItems: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:283

***

### maxLength?

```ts
optional maxLength: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:279

***

### maxProperties?

```ts
optional maxProperties: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:286

***

### minimum?

```ts
optional minimum: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:277

***

### minItems?

```ts
optional minItems: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:284

***

### minLength?

```ts
optional minLength: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:280

***

### minProperties?

```ts
optional minProperties: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:287

***

### multipleOf?

```ts
optional multipleOf: number;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:274

***

### not?

```ts
optional not: ReferenceObject | SchemaObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:296

***

### nullable?

```ts
optional nullable: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:297

***

### oneOf?

```ts
optional oneOf: (ReferenceObject | SchemaObject)[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:294

***

### pattern?

```ts
optional pattern: string;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:281

***

### properties?

```ts
optional properties: object;
```

#### Index Signature

 \[`name`: `string`\]: [`ReferenceObject`](ReferenceObject.md) \| [`SchemaObject`](../type-aliases/SchemaObject.md)

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:290

***

### readOnly?

```ts
optional readOnly: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:299

***

### required?

```ts
optional required: string[];
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:288

***

### title?

```ts
optional title: string;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:270

***

### uniqueItems?

```ts
optional uniqueItems: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:285

***

### writeOnly?

```ts
optional writeOnly: boolean;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:300

***

### xml?

```ts
optional xml: XMLObject;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:301
