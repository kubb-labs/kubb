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
  hooks: {
    done: ['prettier --write "**/*.{ts,tsx}"', 'eslint --fix ./src/gen'],
  },
  plugins: [
    createSwagger({ validate: false }),
    createSwaggerTS({ output: 'models.ts', enumType: 'enum' }),
    createSwaggerTS({
      output: 'modelsConst.ts',
      enumType: 'asConst',
      exportAs: 'modelsAsConst',
    }),
    createSwaggerTS({ output: 'ts-models', oasType: true, exportAs: 'models' }),
  ],
})
