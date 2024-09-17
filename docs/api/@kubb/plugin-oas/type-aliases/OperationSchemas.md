[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / OperationSchemas

# OperationSchemas

```ts
type OperationSchemas: object;
```

## Type declaration

### errors?

```ts
optional errors: OperationSchema[];
```

### headerParams?

```ts
optional headerParams: OperationSchema & object;
```

#### Type declaration

##### keysToOmit?

```ts
optional keysToOmit: never;
```

### pathParams?

```ts
optional pathParams: OperationSchema & object;
```

#### Type declaration

##### keysToOmit?

```ts
optional keysToOmit: never;
```

### queryParams?

```ts
optional queryParams: OperationSchema & object;
```

#### Type declaration

##### keysToOmit?

```ts
optional keysToOmit: never;
```

### request?

```ts
optional request: OperationSchema;
```

### response

```ts
response: OperationSchema;
```

### statusCodes?

```ts
optional statusCodes: OperationSchema[];
```

## Defined in

[plugin-oas/src/types.ts:103](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/types.ts#L103)
