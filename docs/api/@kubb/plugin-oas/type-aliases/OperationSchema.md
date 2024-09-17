[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / OperationSchema

# OperationSchema

```ts
type OperationSchema: object;
```

## Type declaration

### description?

```ts
optional description: string;
```

### keys?

```ts
optional keys: string[];
```

### keysToOmit?

```ts
optional keysToOmit: string[];
```

### name

```ts
name: string;
```

Converted name, contains already `PathParams`, `QueryParams`, ...

### operation?

```ts
optional operation: Operation;
```

### operationName?

```ts
optional operationName: string;
```

OperationName in PascalCase, only being used in OperationGenerator

### schema

```ts
schema: SchemaObject;
```

### statusCode?

```ts
optional statusCode: number;
```

### withData?

```ts
optional withData: boolean;
```

## Defined in

[plugin-oas/src/types.ts:85](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/types.ts#L85)
