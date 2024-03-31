const { defineConfig } = require('@kubb/core')

const { definePlugin: createSwagger } = require('@kubb/swagger')
const { definePlugin: createSwaggerFaker } = require('@kubb/swagger-faker')
const { definePlugin: createSwaggerTS } = require('@kubb/swagger-ts')

module.exports = defineConfig(async () => {
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
    plugins: [
      createSwagger({ output: false }),
      createSwaggerTS({
        output: {
          path: 'models',
        },
      }),
      // createSwaggerFaker({
      //   output: {
      //     path: './mocks',
      //   },
      //   group: { type: 'tag', output: './mocks/{{tag}}Mocks' },
      // }),
      createSwaggerFaker({
        output: {
          path: './customMocks',
        },
        transformers: {
          schema: (_schema, baseName) => {
            /* override a property with name 'name'
             name:
                type: string
                example: doggie
            */
            if (baseName === 'name') {
              // see mapper where we map `productionName` to `faker.commerce.productName`
              return [{ keyword: 'productName' }]
            }
            return undefined
          },
        },
        mapper: {
          message: 'faker.commerce.productName()',
        },
        include: [
          {
            type: 'operationId',
            pattern: 'updatePet',
          },
        ],
        exclude: [],
      }),
    ],
  }
})
