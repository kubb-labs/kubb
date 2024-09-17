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

[plugin-oas/src/types.ts:147](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/plugin-oas/src/types.ts#L147)
