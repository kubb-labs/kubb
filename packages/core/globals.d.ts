/**
* `tsconfig.json`
* @example
"compilerOptions": {
___ "types": ["@kubb/core/globals"]
}
* @example implementation
type SwaggerPlugin = Kubb.Plugins["@kubb/plugin-oas"]
const swaggerPlugin: SwaggerPlugin={
___ validate: true
}
*/
declare namespace Kubb {
  namespace Helpers {
    type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
    type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

    // TS4.0+
    type Push<T extends any[], V> = [...T, V]

    // TS4.1+
    type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

    type ObjValueTuple<T, KS extends any[] = TuplifyUnion<keyof T>, R extends any[] = []> = KS extends [infer K, ...infer KT]
      ? ObjValueTuple<T, KT, [...R, [name: K & keyof T, options: T[K & keyof T]]]>
      : R

    type TupleToUnion<T> = T extends Array<infer ITEMS> ? ITEMS : never
  }
  type Plugins = {
    ['@kubb/plugin-oas']: import('@kubb/plugin-Oas').PluginOas
    ['@kubb/plugin-redoc']: import('@kubb/plugin-redoc').PluginRedoc
    ['@kubb/plugin-client']: import('@kubb/plugin-client').PluginClient
    ['@kubb/plugin-faker']: import('@kubb/plugin-faker').PluginFaker
    ['@kubb/plugin-swr']: import('@kubb/plugin-swr').PluginSwr
    ['@kubb/plugin-tanstack-query']: import('@kubb/plugin-tanstack-query').PluginTanstackQuery
    ['@kubb/plugin-ts']: import('@kubb/plugin-ts').PluginTs
    ['@kubb/plugin-zod']: import('@kubb/plugin-zod').PluginZod
    ['@kubb/plugin-zodios']: import('@kubb/plugin-zodios').PluginZodios
    ['@kubb/plugin-msw']: import('@kubb/plugin-msw').PluginMsw
  }
  type OptionsPlugins = { [K in keyof Plugins]: Plugins[K]['options'] }

  type OptionsOfPlugin<K extends keyof Plugins> = Plugins[K]['options']

  type PluginUnion = Helpers.TupleToUnion<Helpers.ObjValueTuple<OptionsPlugins>>

  type Plugin = keyof Plugins
}
