/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

type KubbObjectPlugins = import('./src/types.ts').KubbObjectPlugins

type KubbObjectPlugin = import('./src/types.ts').KubbObjectPlugin
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
  export interface Plugins extends KubbObjectPlugins {}
  export interface Plugin extends KubbObjectPlugin {}
}
