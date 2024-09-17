[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / SchemaGeneratorOptions

# SchemaGeneratorOptions

```ts
type SchemaGeneratorOptions: object;
```

## Type declaration

### dateType

```ts
dateType: 
  | false
  | "string"
  | "stringOffset"
  | "stringLocal"
  | "date";
```

### enumSuffix?

```ts
optional enumSuffix: string;
```

### enumType?

```ts
optional enumType: 
  | "enum"
  | "asConst"
  | "asPascalConst"
  | "constEnum"
  | "literal";
```

### mapper?

```ts
optional mapper: Record<string, string>;
```

### transformers

```ts
transformers: object;
```

### transformers.name()?

```ts
optional transformers.name: (name, type?) => string;
```

Customize the names based on the type that is provided by the plugin.

#### Parameters

• **name**: [`ResolveNameParams`](../../core/type-aliases/ResolveNameParams.md)\[`"name"`\]

• **type?**: [`ResolveNameParams`](../../core/type-aliases/ResolveNameParams.md)\[`"type"`\]

#### Returns

`string`

### transformers.schema()?

```ts
optional transformers.schema: (schemaProps, defaultSchemas) => Schema[] | undefined;
```

Receive schema and name(propertName) and return FakerMeta array
TODO TODO add docs

#### Parameters

• **schemaProps**: `SchemaProps`

• **defaultSchemas**: [`Schema`](Schema.md)[]

#### Returns

[`Schema`](Schema.md)[] \| `undefined`

### typed?

```ts
optional typed: boolean;
```

### unknownType

```ts
unknownType: "any" | "unknown";
```

### usedEnumNames?

```ts
optional usedEnumNames: Record<string, number>;
```

## Defined in

[plugin-oas/src/SchemaGenerator.ts:37](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/plugin-oas/src/SchemaGenerator.ts#L37)
