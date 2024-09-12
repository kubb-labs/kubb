[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / Ref

# Ref

```ts
type Ref: object;
```

`propertyName` is the ref name + resolved with the nameResolver

## Type declaration

### originalName

```ts
originalName: string;
```

### path

```ts
path: KubbFile.OptionalPath;
```

### pluginKey?

```ts
optional pluginKey: Plugin["key"];
```

### propertyName

```ts
propertyName: string;
```

## Examples

```ts
`import { Pet } from './Pet'`

`originalName` is the original name used(in PascalCase), only used to remove duplicates

`pluginKey` can be used to override the current plugin being used, handy when you want to import a type/schema out of another plugin
```

```ts
import a type(plugin-ts) for a mock file(swagger-faker)
```

## Defined in

[plugin-oas/src/types.ts:74](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/plugin-oas/src/types.ts#L74)
