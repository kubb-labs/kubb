/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

type KubbObjectPlugins = {
  ['@kubb/swagger']: import('@kubb/swagger').PluginOptions
  ['@kubb/swagger-client']: import('@kubb/swagger-client').PluginOptions
  ['@kubb/swagger-faker']: import('@kubb/swagger-faker').PluginOptions
  ['@kubb/swagger-swr']: import('@kubb/swagger-swr').PluginOptions
  ['@kubb/swagger-tanstack-query']: import('@kubb/swagger-tanstack-query').PluginOptions
  ['@kubb/swagger-ts']: import('@kubb/swagger-ts').PluginOptions
  ['@kubb/swagger-zod']: import('@kubb/swagger-zod').PluginOptions
  ['@kubb/swagger-zodios']: import('@kubb/swagger-zodios').PluginOptions
  ['@kubb/swagger-msw']: import('@kubb/swagger-msw').PluginOptions
}
/**
* `tsconfig.json`
* @example
"compilerOptions": {
___ "types": ["@kubb/core/globals"]
}
* @example implementation
type SwaggerPlugin = Kubb.Plugins["@kubb/swagger"]
const swaggerPlugin: SwaggerPlugin={
___ validate: true
}
*/
declare module Kubb {
  type Plugins = _Register
  type OptionsPlugins = { [K in keyof KubbObjectPlugins]: KubbObjectPlugins[K]['options'] }

  type OptionsOfPlugin<K extends keyof KubbObjectPlugins> = KubbObjectPlugins[K]['options']

  type Plugin = keyof KubbObjectPlugins
}
