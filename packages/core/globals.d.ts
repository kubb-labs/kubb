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
    ['@kubb/swagger-client']: import('@kubb/swagger-client').PluginClient
    ['@kubb/swagger-faker']: import('@kubb/swagger-faker').PluginFaker
    ['@kubb/swagger-swr']: import('@kubb/swagger-swr').PluginSwr
    ['@kubb/swagger-tanstack-query']: import('@kubb/swagger-tanstack-query').PluginTanstackQuery
    ['@kubb/swagger-ts']: import('@kubb/swagger-ts').PluginTs
    ['@kubb/swagger-zod']: import('@kubb/swagger-zod').PluginZod
    ['@kubb/swagger-zodios']: import('@kubb/swagger-zodios').PluginZodios
    ['@kubb/swagger-msw']: import('@kubb/swagger-msw').PluginMsw
  }
  type OptionsPlugins = { [K in keyof Plugins]: Plugins[K]['options'] }

  type OptionsOfPlugin<K extends keyof Plugins> = Plugins[K]['options']

  type PluginUnion = Helpers.TupleToUnion<Helpers.ObjValueTuple<OptionsPlugins>>

  type Plugin = keyof Plugins
}
