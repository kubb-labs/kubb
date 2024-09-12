[API](../../../packages.md) / [@kubb/core](../index.md) / Plugin

# Plugin\<TOptions\>

```ts
type Plugin<TOptions>: object & TOptions["context"] extends never ? object : object;
```

## Type declaration

### name

```ts
name: TOptions["name"];
```

Unique name used for the plugin

#### Example

```ts
@kubb/typescript
```

### options

```ts
options: TOptions["resolvedOptions"];
```

Options set for a specific plugin(see kubb.config.js), passthrough of options.

### output?

```ts
optional output: object;
```

### output.exportType?

```ts
optional output.exportType: "barrel" | "barrelNamed" | false;
```

Define what needs to exported, here you can also disable the export of barrel files

#### Default

`'barrelNamed'`

### output.extName?

```ts
optional output.extName: KubbFile.Extname;
```

Add an extension to the generated imports and exports, default it will not use an extension

### output.path

```ts
output.path: string;
```

Output to save the clients.

### post?

```ts
optional post: string[];
```

Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin will be executed before these plugins.

### pre?

```ts
optional pre: string[];
```

Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin will be executed after these plugins.
Can be used to validate dependent plugins.

## Type Parameters

• **TOptions** *extends* [`PluginFactoryOptions`](PluginFactoryOptions.md) = [`PluginFactoryOptions`](PluginFactoryOptions.md)

## Defined in

[types.ts:172](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/core/src/types.ts#L172)
