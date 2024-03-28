import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    createSwagger({ validate: false }),
    createSwaggerTS({
      output: {
        path: 'models.ts',
        exportAs: 'models',
      },
      enumType: 'enum',
    }),
    createSwaggerTS({
      output: {
        path: 'modelsConst.ts',
        exportAs: 'modelsAsConst',
      },
      enumType: 'asConst',
    }),
    createSwaggerTS({
      output: {
        path: 'modelsPascalConst.ts',
        exportAs: 'modelsPascalConst',
      },
      enumType: 'asPascalConst',
    }),
    createSwaggerTS({
      output: {
        path: 'modelsConstEnum.ts',
        exportAs: 'modelsConstEnum',
      },
      enumType: 'constEnum',
    }),
    createSwaggerTS({
      output: {
        path: 'modelsLiteral.ts',
        exportAs: 'modelsLiteral',
      },
      enumType: 'literal',
    }),
    createSwaggerTS({
      output: {
        path: 'ts/models',
        exportType: 'barrelNamed',
      },
      oasType: 'infer',
    }),
  ],
})
