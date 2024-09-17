[API](../../packages.md) / @kubb/core

# @kubb/core

## References

### default

Renames and re-exports [build](functions/build.md)

## Classes

| Class | Description |
| ------ | ------ |
| [BaseGenerator](classes/BaseGenerator.md) | Abstract class that contains the building blocks for plugins to create their own Generator |
| [FileManager](classes/FileManager.md) | - |
| [PackageManager](classes/PackageManager.md) | - |
| [PluginManager](classes/PluginManager.md) | - |
| [PromiseManager](classes/PromiseManager.md) | - |

## Type Aliases

| Type alias | Description |
| ------ | ------ |
| [FileMetaBase](type-aliases/FileMetaBase.md) | - |
| [GetPluginFactoryOptions](type-aliases/GetPluginFactoryOptions.md) | - |
| [InputData](type-aliases/InputData.md) | - |
| [InputPath](type-aliases/InputPath.md) | - |
| [Output](type-aliases/Output.md) | - |
| [Plugin](type-aliases/Plugin.md) | - |
| [PluginCache](type-aliases/PluginCache.md) | - |
| [PluginContext](type-aliases/PluginContext.md) | - |
| [PluginFactoryOptions](type-aliases/PluginFactoryOptions.md) | - |
| [PluginKey](type-aliases/PluginKey.md) | - |
| [PluginLifecycle](type-aliases/PluginLifecycle.md) | - |
| [PluginLifecycleHooks](type-aliases/PluginLifecycleHooks.md) | - |
| [PluginParameter](type-aliases/PluginParameter.md) | - |
| [PluginWithLifeCycle](type-aliases/PluginWithLifeCycle.md) | - |
| [ResolveNameParams](type-aliases/ResolveNameParams.md) | - |
| [ResolvePathParams](type-aliases/ResolvePathParams.md) | - |
| [UserConfig](type-aliases/UserConfig.md) | Config used in `kubb.config.js` |
| [UserPlugin](type-aliases/UserPlugin.md) | - |
| [UserPluginWithLifeCycle](type-aliases/UserPluginWithLifeCycle.md) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [build](functions/build.md) | - |
| [createPlugin](functions/createPlugin.md) | - |
| [defineConfig](functions/defineConfig.md) | Type helper to make it easier to use vite.config.ts accepts a direct UserConfig object, or a function that returns it. The function receives a ConfigEnv object. |
| [getSource](functions/getSource.md) | - |
| [isInputPath](functions/isInputPath.md) | - |
| [safeBuild](functions/safeBuild.md) | - |
