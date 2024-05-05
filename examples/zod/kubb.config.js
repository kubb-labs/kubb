import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger, schemaKeywords } from '@kubb/swagger'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'
import { definePlugin as createSwaggerZod } from '@kubb/swagger-zod'

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
    plugins: [
      createSwagger({ output: false }),
      createSwaggerTS({
        output: {
          path: './ts',
        },
      }),
      createSwaggerZod({
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
        mapper: {
          productName: 'z.string().uuid()',
        },
      }),
    ],
  }
})
