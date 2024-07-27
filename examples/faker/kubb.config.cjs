const { defineConfig } = require('@kubb/core')

const { pluginOas, schemaKeywords } = require('@kubb/plugin-oas')
const { pluginFaker } = require('@kubb/plugin-faker')
const { pluginTs } = require('@kubb/swagger-ts')

module.exports = defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [
      pluginOas({ output: false }),
      pluginTs({
        output: {
          path: 'models',
        },
      }),
      pluginFaker({
        output: {
          path: './customMocks',
        },
        transformers: {
          schema: ({ schema, name, parentName }, defaultSchemas) => {
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
        exclude: [],
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
  }
})
