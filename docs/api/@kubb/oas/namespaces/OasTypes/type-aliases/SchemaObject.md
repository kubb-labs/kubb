[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OasTypes](../index.md) / SchemaObject

# SchemaObject

```ts
type SchemaObject: object & object & SchemaObject | SchemaObject | JSONSchema;
```

## Type declaration

### externalDocs?

```ts
optional externalDocs: unknown;
```

### xml?

```ts
optional xml: unknown;
```

## Type declaration

### $schema?

```ts
optional $schema: string;
```

### components?

```ts
optional components: ComponentsObject;
```

### deprecated?

```ts
optional deprecated: boolean;
```

### example?

```ts
optional example: unknown;
```

### examples?

```ts
optional examples: unknown[];
```

### nullable?

```ts
optional nullable: boolean;
```

### readOnly?

```ts
optional readOnly: boolean;
```

### writeOnly?

```ts
optional writeOnly: boolean;
```

### x-readme-ref-name?

```ts
optional x-readme-ref-name: string;
```

## See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#schemaObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#schemaObject)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#schemaObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#schemaObject)

## Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/types.d.ts:138
