[API](../../../packages.md) / [@kubb/core](../index.md) / UserPlugin

# UserPlugin\<TOptions\>

```ts
type UserPlugin<TOptions>: object & TOptions["context"] extends never ? object : object;
```

## Type declaration

### name

```ts
name: TOptions["name"];
```

Unique name used for the plugin
The name of the plugin follows the format scope:foo-bar or foo-bar, adding scope: can avoid naming conflicts with other plugins.

#### Example

```ts
@kubb/typescript
```

### options

```ts
options: TOptions["resolvedOptions"];
```

Options set for a specific plugin(see kubb.config.js), passthrough of options.

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

[types.ts:140](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/types.ts#L140)
