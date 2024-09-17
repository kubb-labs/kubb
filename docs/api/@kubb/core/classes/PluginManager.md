[API](../../../packages.md) / [@kubb/core](../index.md) / PluginManager

# PluginManager

## Constructors

### new PluginManager()

```ts
new PluginManager(config, options): PluginManager
```

#### Parameters

• **config**: `Config`

• **options**: `Options`

#### Returns

[`PluginManager`](PluginManager.md)

#### Defined in

[PluginManager.ts:90](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L90)

## Properties

### config

```ts
readonly config: Config;
```

#### Defined in

[PluginManager.ts:80](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L80)

***

### events

```ts
readonly events: EventEmitter<Events>;
```

#### Defined in

[PluginManager.ts:78](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L78)

***

### executed

```ts
readonly executed: Executer<keyof PluginLifecycle<PluginFactoryOptions<string, object, object, any, object>>>[] = [];
```

#### Defined in

[PluginManager.ts:82](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L82)

***

### fileManager

```ts
readonly fileManager: FileManager;
```

#### Defined in

[PluginManager.ts:77](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L77)

***

### logger

```ts
readonly logger: Logger;
```

#### Defined in

[PluginManager.ts:83](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L83)

***

### options

```ts
readonly options: Options;
```

#### Defined in

[PluginManager.ts:84](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L84)

***

### plugins

```ts
readonly plugins: Set<Plugin<PluginFactoryOptions<string, object, object, any, object>>>;
```

#### Defined in

[PluginManager.ts:76](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L76)

## Accessors

### hooks

```ts
get static hooks(): readonly ["buildStart", "resolvePath", "resolveName", "buildEnd"]
```

#### Returns

readonly [`"buildStart"`, `"resolvePath"`, `"resolveName"`, `"buildEnd"`]

#### Defined in

[PluginManager.ts:730](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L730)

## Methods

### getFile()

```ts
getFile<TOptions>(__namedParameters): File<object>
```

#### Type Parameters

• **TOptions** = `object`

#### Parameters

• **\_\_namedParameters**: `GetFileProps`\<`TOptions`\>

#### Returns

`File`\<`object`\>

##### pluginKey

```ts
pluginKey: PluginKey<string>;
```

#### Defined in

[PluginManager.ts:120](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L120)

***

### getPluginsByKey()

```ts
getPluginsByKey(hookName, pluginKey): Plugin[]
```

#### Parameters

• **hookName**: keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)

• **pluginKey**: [`PluginKey`](../type-aliases/PluginKey.md)\<`string`\>

#### Returns

[`Plugin`](../type-aliases/Plugin.md)[]

#### Defined in

[PluginManager.ts:492](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L492)

***

### hookFirst()

```ts
hookFirst<H>(__namedParameters): Promise<SafeParseResult<H, ReturnType<ParseResult<H>>>>
```

First non-null result stops and will return it's value.

#### Type Parameters

• **H** *extends* keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\<[`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)\<`string`, `object`, `object`, `any`, `object`\>\>

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.hookName**: `H`

• **\_\_namedParameters.message**: `string`

• **\_\_namedParameters.parameters**: [`PluginParameter`](../type-aliases/PluginParameter.md)\<`H`\>

• **\_\_namedParameters.skipped?**: `null` \| `ReadonlySet`\<[`Plugin`](../type-aliases/Plugin.md)\>

#### Returns

`Promise`\<`SafeParseResult`\<`H`, `ReturnType`\<`ParseResult`\<`H`\>\>\>\>

#### Defined in

[PluginManager.ts:277](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L277)

***

### hookFirstSync()

```ts
hookFirstSync<H>(__namedParameters): SafeParseResult<H, ReturnType<ParseResult<H>>>
```

First non-null result stops and will return it's value.

#### Type Parameters

• **H** *extends* keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\<[`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)\<`string`, `object`, `object`, `any`, `object`\>\>

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.hookName**: `H`

• **\_\_namedParameters.message**: `string`

• **\_\_namedParameters.parameters**: [`PluginParameter`](../type-aliases/PluginParameter.md)\<`H`\>

• **\_\_namedParameters.skipped?**: `null` \| `ReadonlySet`\<[`Plugin`](../type-aliases/Plugin.md)\>

#### Returns

`SafeParseResult`\<`H`, `ReturnType`\<`ParseResult`\<`H`\>\>\>

#### Defined in

[PluginManager.ts:321](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L321)

***

### hookForPlugin()

```ts
hookForPlugin<H>(__namedParameters): Promise<(null | ReturnType<ParseResult<H>>)[]>
```

Run a specific hookName for plugin x.

#### Type Parameters

• **H** *extends* keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\<[`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)\<`string`, `object`, `object`, `any`, `object`\>\>

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.hookName**: `H`

• **\_\_namedParameters.message**: `string`

• **\_\_namedParameters.parameters**: [`PluginParameter`](../type-aliases/PluginParameter.md)\<`H`\>

• **\_\_namedParameters.pluginKey**: [`PluginKey`](../type-aliases/PluginKey.md)\<`string`\>

#### Returns

`Promise`\<(`null` \| `ReturnType`\<`ParseResult`\<`H`\>\>)[]\>

#### Defined in

[PluginManager.ts:209](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L209)

***

### hookForPluginSync()

```ts
hookForPluginSync<H>(__namedParameters): null | ReturnType<ParseResult<H>>[]
```

Run a specific hookName for plugin x.

#### Type Parameters

• **H** *extends* keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\<[`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)\<`string`, `object`, `object`, `any`, `object`\>\>

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.hookName**: `H`

• **\_\_namedParameters.message**: `string`

• **\_\_namedParameters.parameters**: [`PluginParameter`](../type-aliases/PluginParameter.md)\<`H`\>

• **\_\_namedParameters.pluginKey**: [`PluginKey`](../type-aliases/PluginKey.md)\<`string`\>

#### Returns

`null` \| `ReturnType`\<`ParseResult`\<`H`\>\>[]

#### Defined in

[PluginManager.ts:246](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L246)

***

### hookParallel()

```ts
hookParallel<H, TOuput>(__namedParameters): Promise<Awaited<TOuput>[]>
```

Run all plugins in parallel(order will be based on `this.plugin` and if `pre` or `post` is set).

#### Type Parameters

• **H** *extends* keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\<[`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)\<`string`, `object`, `object`, `any`, `object`\>\>

• **TOuput** = `void`

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.hookName**: `H`

• **\_\_namedParameters.message**: `string`

• **\_\_namedParameters.parameters?**: `Parameters`\<`Required`\<[`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\>\[`H`\]\>

#### Returns

`Promise`\<`Awaited`\<`TOuput`\>[]\>

#### Defined in

[PluginManager.ts:360](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L360)

***

### hookReduceArg0()

```ts
hookReduceArg0<H>(__namedParameters): Promise<Argument0<H>>
```

Chain all plugins, `reduce` can be passed through to handle every returned value. The return value of the first plugin will be used as the first parameter for the plugin after that.

#### Type Parameters

• **H** *extends* keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\<[`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)\<`string`, `object`, `object`, `any`, `object`\>\>

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.hookName**: `H`

• **\_\_namedParameters.message**: `string`

• **\_\_namedParameters.parameters**: [`PluginParameter`](../type-aliases/PluginParameter.md)\<`H`\>

• **\_\_namedParameters.reduce**

#### Returns

`Promise`\<`Argument0`\<`H`\>\>

#### Defined in

[PluginManager.ts:401](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L401)

***

### hookSeq()

```ts
hookSeq<H>(__namedParameters): Promise<void>
```

Chains plugins

#### Type Parameters

• **H** *extends* keyof [`PluginLifecycle`](../type-aliases/PluginLifecycle.md)\<[`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)\<`string`, `object`, `object`, `any`, `object`\>\>

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.hookName**: `H`

• **\_\_namedParameters.message**: `string`

• **\_\_namedParameters.parameters?**: [`PluginParameter`](../type-aliases/PluginParameter.md)\<`H`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[PluginManager.ts:437](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L437)

***

### on()

```ts
on<TEventName>(eventName, handler): void
```

Instead of calling `pluginManager.events.on` you can use `pluginManager.on`. This one also has better types.

#### Type Parameters

• **TEventName** *extends* `"error"` \| `"executing"` \| `"executed"`

#### Parameters

• **eventName**: `TEventName`

• **handler**

#### Returns

`void`

#### Defined in

[PluginManager.ts:202](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L202)

***

### resolveName()

```ts
resolveName(params): string
```

#### Parameters

• **params**: [`ResolveNameParams`](../type-aliases/ResolveNameParams.md)

#### Returns

`string`

#### Defined in

[PluginManager.ts:167](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L167)

***

### resolvePath()

```ts
resolvePath<TOptions>(params): OptionalPath
```

#### Type Parameters

• **TOptions** = `object`

#### Parameters

• **params**: [`ResolvePathParams`](../type-aliases/ResolvePathParams.md)\<`TOptions`\>

#### Returns

`OptionalPath`

#### Defined in

[PluginManager.ts:138](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L138)

***

### getDependedPlugins()

```ts
static getDependedPlugins<T1, T2, T3, TOutput>(plugins, dependedPluginNames): TOutput
```

#### Type Parameters

• **T1** *extends* [`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md)

• **T2** *extends* [`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md) = `never`

• **T3** *extends* [`PluginFactoryOptions`](../type-aliases/PluginFactoryOptions.md) = `never`

• **TOutput** = `T3` *extends* `never` ? `T2` *extends* `never` ? [[`Plugin`](../type-aliases/Plugin.md)\<`T1`\>] : [[`Plugin`](../type-aliases/Plugin.md)\<`T1`\>, [`Plugin`](../type-aliases/Plugin.md)\<`T2`\>] : [[`Plugin`](../type-aliases/Plugin.md)\<`T1`\>, [`Plugin`](../type-aliases/Plugin.md)\<`T2`\>, [`Plugin`](../type-aliases/Plugin.md)\<`T3`\>]

#### Parameters

• **plugins**: [`Plugin`](../type-aliases/Plugin.md)[]

• **dependedPluginNames**: `string` \| `string`[]

#### Returns

`TOutput`

#### Defined in

[PluginManager.ts:708](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PluginManager.ts#L708)
