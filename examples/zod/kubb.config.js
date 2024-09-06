import { defineConfig } from '@kubb/core'
import { pluginOas, schemaKeywords } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig(async () => {
  await setTimeout(() => {
    // wait for 1s, async behaviour
    return Promise.resolve(true)
  }, 1000)
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
    },
    plugins: [
      pluginOas({ output: false }),
      pluginTs({
        output: {
          path: './ts',
        },
        transformers: {
          name: (name, type) => {
            return `${name}Type`
          },
        },
      }),
      pluginZod({
        output: {
          path: './zod',
        },
        transformers: {
          name: (name, type) => (type === 'file' ? `${name}.gen` : name),
          schema: ({ schema, parentName, name }, defaultSchemas) => {
            /* override a property with name 'name'
               Pet:
                  required:
                    - name
                  type: object
                  properties:
                    name:
                      type: string
                      example: doggie
            */
            if (parentName === 'Pet' && name === 'name') {
              // see mapper where we map `productionName` to `faker.commerce.productName`, the original name will be kept.
              return [...defaultSchemas, { keyword: schemaKeywords.name, args: 'productName' }]
            }
            return undefined
          },
        },
        operations: true,
        mapper: {
          productName: 'z.string().uuid()',
        },
        importPath: '../../zod.ts',
        typedSchema: true,
      }),
    ],
  }
})
