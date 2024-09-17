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

[plugin-oas/src/types.ts:147](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/types.ts#L147)
