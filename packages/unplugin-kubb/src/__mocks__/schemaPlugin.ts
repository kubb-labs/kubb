import { ast } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { defineExtension, type Output, type Plugin } from '@kubb/core'

/**
 * A plugin that writes `<prefix>_<schema>` per schema into a file per schema, and, with
 * `importFrom`, imports the matching name from that plugin's file, the way plugin-zod imports
 * plugin-ts types.
 */
export function createSchemaPlugin(prefix: string, importFrom?: string): Plugin {
  return defineExtension({
    kind: 'plugin',
    meta: { name: `plugin-${prefix}` },
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({ output: (ctx.options as { output?: { path: string } }).output ?? { path: prefix } })
        ctx.addGenerator({
          name: `${prefix}-generator`,
          schema(node, { resolver, root, options, driver }) {
            const file = resolver.file({ name: node.name ?? 'unknown', extname: '.ts', root, output: (options as { output: Output }).output })
            const source = importFrom
              ? `export const ${prefix}_${node.name}: ${importFrom}_${node.name} = { id: 1 }`
              : `export type ${prefix}_${node.name} = { id: number }\nexport const ${prefix}_${node.name}Value = { id: 1 }`
            const imported = importFrom && driver.plugins.get(`plugin-${importFrom}`)

            return [
              ast.factory.createFile({
                path: file.path,
                baseName: file.baseName,
                sources: [ast.factory.createSource({ nodes: [ast.factory.createText(source)] })],
                imports: imported
                  ? [
                      ast.factory.createImport({
                        name: [`${importFrom}_${node.name}`],
                        path: imported.resolver.file({ name: node.name ?? 'unknown', extname: '.ts', root, output: imported.options.output }).path,
                        root: file.path,
                        isTypeOnly: true,
                      }),
                    ]
                  : [],
              }),
            ]
          },
        })
      },
    },
  })()
}

export const schemaAdapter = createMockedAdapter({
  parse: async () =>
    ast.factory.createInput({
      schemas: [
        ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] }),
        ast.factory.createSchema({ type: 'object', name: 'Tag', properties: [] }),
      ],
    }),
})
