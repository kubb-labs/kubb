[API](../../../packages.md) / [@kubb/core](../index.md) / ResolveNameParams

# ResolveNameParams

```ts
type ResolveNameParams: object;
```

## Type declaration

### name

```ts
name: string;
```

### pluginKey?

```ts
optional pluginKey: Plugin["key"];
```

### type?

```ts
optional type: "file" | "function" | "type";
```

`file` will be used to customize the name of the created file(use of camelCase)
`function` can be used used to customize the exported functions(use of camelCase)
`type` is a special type for TypeScript(use of PascalCase)

## Defined in

[types.ts:252](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/types.ts#L252)
