import { defineConfig } from '@kubb/core'

import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
      // done: ['prettier --write "**/*.{ts,tsx}"', 'eslint --fix ./src/gen'],
    },
    plugins: [
      createSwagger({ output: false }),
      createSwaggerTS({
        output: {
          path: 'models',
        },
      }),
      // createSwaggerFaker({
      //   output: './mocks',
      //   group: { type: 'tag', output: './mocks/{{tag}}Mocks' },
      // }),
      createSwaggerFaker({
        output: './customMocks',
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
          'productName': 'faker.commerce.productName',
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
