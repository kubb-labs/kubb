[API](../../../packages.md) / [@kubb/core](../index.md) / Output

# Output

```ts
type Output: object;
```

## Type declaration

### banner?

```ts
optional banner: string;
```

Add a banner text in the beginning of every file

### exportAs?

```ts
optional exportAs: string;
```

Name to be used for the `export * as {{exportAs}} from './'`

### exportType?

```ts
optional exportType: "barrel" | "barrelNamed" | false;
```

Define what needs to exported, here you can also disable the export of barrel files

#### Default

`'barrelNamed'`

### extName?

```ts
optional extName: KubbFile.Extname;
```

Add an extension to the generated imports and exports, default it will not use an extension

### footer?

```ts
optional footer: string;
```

Add a footer text in the beginning of every file

### path

```ts
path: string;
```

Output to save the generated files.

## Defined in

[types.ts:281](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/types.ts#L281)
