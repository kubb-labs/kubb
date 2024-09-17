[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / Override

# Override\<TOptions\>

```ts
type Override<TOptions>: 
  | ByTag
  | ByOperationId
  | ByPath
  | ByMethod
  | BySchemaName & object;
```

## Type declaration

### options

```ts
options: Partial<TOptions>;
```

## Type Parameters

• **TOptions**

## Defined in

[plugin-oas/src/types.ts:147](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/plugin-oas/src/types.ts#L147)
