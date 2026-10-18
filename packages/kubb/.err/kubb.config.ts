import { defineConfig } from 'kubb/config'
import { ast, defineExtension } from 'kubb/kit'

const pluginTypes = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-types' },
  hooks: {
    'kubb:plugin:setup'(ctx) {
      ctx.addGenerator({
        name: 'types',
        schema(node) {
          return [
            ast.factory.createFile({
              path: `${ctx.config.root}/src/gen/${node.name}.ts`,
              baseName: `${node.name}.ts`,
              sources: [ast.factory.createSource({ nodes: [ast.factory.createText('export {}')] })],
              imports: [],
              exports: [],
            }),
          ]
        },
      })
    },
  },
})()

export default defineConfig({ input: './petStore.yaml', output: { path: './src/gen', clean: true, format: false, lint: false }, plugins: [pluginTypes] })
