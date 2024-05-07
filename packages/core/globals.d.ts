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
  type OptionsPlugins = { [K in keyof Plugins]: Plugins[K]['options'] }

  type OptionsOfPlugin<K extends keyof Plugins> = Plugins[K]['options']

  type PluginUnion = Helpers.TupleToUnion<Helpers.ObjValueTuple<OptionsPlugins>>

  type Plugin = keyof Plugins
}
