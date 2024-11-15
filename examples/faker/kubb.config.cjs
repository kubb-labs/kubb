// require('@kubb/react/devtools') // enable/disable devtools

const { defineConfig } = require('@kubb/core')

const { pluginOas, schemaKeywords } = require('@kubb/plugin-oas')
const { pluginFaker } = require('@kubb/plugin-faker')
const { pluginTs } = require('@kubb/plugin-ts')

module.exports = defineConfig(() => {
  return [
    {
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
        pluginOas({ generators: [] }),
        pluginTs({
          output: {
            path: 'models',
          },
        }),
        pluginFaker({
          output: {
            path: './tag',
            barrelType: false,
          },
          include: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          dataReturnType: 'full',
          pathParamsType: 'object',
        }),
      ],
    },
    {
      root: '.',
      input: {
        path: './petStore.yaml',
      },
      output: {
        path: './src/gen',
      },
      hooks: {
        done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
      },
      plugins: [
        pluginOas({ generators: [] }),
        pluginTs({
          output: {
            path: 'models',
          },
        }),
        pluginFaker({
          output: {
            path: './faker',
          },
          transformers: {
            schema({ schema, name, parentName }, defaultSchemas) {
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
          mapper: {
            productName: 'faker.commerce.productName()',
            message: 'faker.string.alpha({casing: "lower"})',
          },
          include: [
            {
              type: 'operationId',
              pattern: 'updatePet',
            },
          ],
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          override: [
            {
              type: 'schemaName',
              pattern: /Order/i,
              options: {
                dateType: 'string',
                dateParser: 'dayjs',
              },
            },
          ],
        }),
      ],
    },
  ]
})
