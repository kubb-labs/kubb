[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / Options

# Options

```ts
type Options: object;
```

## Type declaration

### contentType?

```ts
optional contentType: contentType;
```

Define which contentType should be used.
By default, this is set based on the first used contentType..

### experimentalFilter?

```ts
optional experimentalFilter: FormatOptions["filterSet"];
```

### experimentalSort?

```ts
optional experimentalSort: FormatOptions["sortSet"];
```

### generators?

```ts
optional generators: Generator<PluginOas>[];
```

Define some generators next to the JSON generation

### oasClass?

```ts
optional oasClass: typeof Oas;
```

Override some behaviour of the Oas class instance, see '@kubb/oas'

### output?

```ts
optional output: object;
```

### output.exportType?

```ts
optional output.exportType: "barrel" | "barrelNamed" | false;
```

### output.extName?

```ts
optional output.extName: KubbFile.Extname;
```

### output.path

```ts
output.path: string;
```

Relative path to save the JSON models.
False will not generate the schema JSON's.

#### Default

```ts
'schemas'
```

### serverIndex?

```ts
optional serverIndex: number;
```

Which server to use from the array of `servers.url[serverIndex]`

#### Example

```ts
- `0` will return `http://petstore.swagger.io/api`
- `1` will return `http://localhost:3000`
```

#### Default

```ts
0
```

### validate?

```ts
optional validate: boolean;
```

Validate your input(see kubb.config) based on '@readme/openapi-parser'.

#### Default

```ts
true
```

## Defined in

[plugin-oas/src/types.ts:23](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/plugin-oas/src/types.ts#L23)
