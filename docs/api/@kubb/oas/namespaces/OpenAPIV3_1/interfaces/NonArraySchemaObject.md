[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3\_1](../index.md) / NonArraySchemaObject

# NonArraySchemaObject

## Extends

- [`BaseSchemaObject`](../type-aliases/BaseSchemaObject.md)

## Properties

### $schema?

```ts
optional $schema: string;
```

#### Inherited from

`BaseSchemaObject.$schema`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:84

***

### additionalProperties?

```ts
optional additionalProperties: boolean | ReferenceObject | SchemaObject;
```

#### Inherited from

`BaseSchemaObject.additionalProperties`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:85

***

### allOf?

```ts
optional allOf: (ReferenceObject | SchemaObject)[];
```

#### Inherited from

`BaseSchemaObject.allOf`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:89

***

### anyOf?

```ts
optional anyOf: (ReferenceObject | SchemaObject)[];
```

#### Inherited from

`BaseSchemaObject.anyOf`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:91

***

### const?

```ts
optional const: any;
```

#### Inherited from

`BaseSchemaObject.const`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:96

***

### contentMediaType?

```ts
optional contentMediaType: string;
```

#### Inherited from

`BaseSchemaObject.contentMediaType`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:83

***

### default?

```ts
optional default: any;
```

#### Inherited from

`BaseSchemaObject.default`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:273

***

### deprecated?

```ts
optional deprecated: boolean;
```

#### Inherited from

`BaseSchemaObject.deprecated`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:304

***

### description?

```ts
optional description: string;
```

#### Inherited from

`BaseSchemaObject.description`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:271

***

### discriminator?

```ts
optional discriminator: DiscriminatorObject;
```

#### Inherited from

`BaseSchemaObject.discriminator`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:93

***

### enum?

```ts
optional enum: any[];
```

#### Inherited from

`BaseSchemaObject.enum`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:289

***

### example?

```ts
optional example: any;
```

#### Inherited from

`BaseSchemaObject.example`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:303

***

### examples?

```ts
optional examples: any[];
```

#### Inherited from

`BaseSchemaObject.examples`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:80

***

### exclusiveMaximum?

```ts
optional exclusiveMaximum: number | boolean;
```

#### Inherited from

`BaseSchemaObject.exclusiveMaximum`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:82

***

### exclusiveMinimum?

```ts
optional exclusiveMinimum: number | boolean;
```

#### Inherited from

`BaseSchemaObject.exclusiveMinimum`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:81

***

### externalDocs?

```ts
optional externalDocs: ExternalDocumentationObject;
```

#### Inherited from

`BaseSchemaObject.externalDocs`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:94

***

### format?

```ts
optional format: string;
```

#### Inherited from

`BaseSchemaObject.format`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:272

***

### maximum?

```ts
optional maximum: number;
```

#### Inherited from

`BaseSchemaObject.maximum`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:275

***

### maxItems?

```ts
optional maxItems: number;
```

#### Inherited from

`BaseSchemaObject.maxItems`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:283

***

### maxLength?

```ts
optional maxLength: number;
```

#### Inherited from

`BaseSchemaObject.maxLength`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:279

***

### maxProperties?

```ts
optional maxProperties: number;
```

#### Inherited from

`BaseSchemaObject.maxProperties`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:286

***

### minimum?

```ts
optional minimum: number;
```

#### Inherited from

`BaseSchemaObject.minimum`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:277

***

### minItems?

```ts
optional minItems: number;
```

#### Inherited from

`BaseSchemaObject.minItems`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:284

***

### minLength?

```ts
optional minLength: number;
```

#### Inherited from

`BaseSchemaObject.minLength`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:280

***

### minProperties?

```ts
optional minProperties: number;
```

#### Inherited from

`BaseSchemaObject.minProperties`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:287

***

### multipleOf?

```ts
optional multipleOf: number;
```

#### Inherited from

`BaseSchemaObject.multipleOf`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:274

***

### not?

```ts
optional not: ReferenceObject | SchemaObject;
```

#### Inherited from

`BaseSchemaObject.not`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:92

***

### oneOf?

```ts
optional oneOf: (ReferenceObject | SchemaObject)[];
```

#### Inherited from

`BaseSchemaObject.oneOf`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:90

***

### pattern?

```ts
optional pattern: string;
```

#### Inherited from

`BaseSchemaObject.pattern`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:281

***

### properties?

```ts
optional properties: object;
```

#### Index Signature

 \[`name`: `string`\]: [`ReferenceObject`](../type-aliases/ReferenceObject.md) \| [`SchemaObject`](../type-aliases/SchemaObject.md)

#### Inherited from

`BaseSchemaObject.properties`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:86

***

### readOnly?

```ts
optional readOnly: boolean;
```

#### Inherited from

`BaseSchemaObject.readOnly`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:299

***

### required?

```ts
optional required: string[];
```

#### Inherited from

`BaseSchemaObject.required`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:288

***

### title?

```ts
optional title: string;
```

#### Inherited from

`BaseSchemaObject.title`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:270

***

### type?

```ts
optional type: NonArraySchemaObjectType;
```

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:73

***

### uniqueItems?

```ts
optional uniqueItems: boolean;
```

#### Inherited from

`BaseSchemaObject.uniqueItems`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:285

***

### writeOnly?

```ts
optional writeOnly: boolean;
```

#### Inherited from

`BaseSchemaObject.writeOnly`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:300

***

### xml?

```ts
optional xml: XMLObject;
```

#### Inherited from

`BaseSchemaObject.xml`

#### Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:95
