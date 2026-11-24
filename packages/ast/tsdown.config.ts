import { defineConfig } from 'tsdown'
import { packageBuilds } from '../../configs/tsdown.ts'

export default defineConfig(
  packageBuilds({
    // One entry per `ast.*` namespace, so a package can extend a namespace with `export * from '@kubb/ast/<name>'`.
    entry: {
      index: 'src/index.ts',
      factory: 'src/nodes/index.ts',
      file: 'src/file/index.ts',
      graph: 'src/graph/index.ts',
      http: 'src/http/index.ts',
      json: 'src/json/index.ts',
      macro: 'src/macro/index.ts',
      mediaType: 'src/mediaType/index.ts',
      node: 'src/node/index.ts',
      ref: 'src/ref/index.ts',
      schema: 'src/schema/index.ts',
    },
    deps: {},
  }),
)
