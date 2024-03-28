import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerSWR from '@kubb/swagger-swr'
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
    createSwagger({ output: false }),
    createSwaggerTS({
      output: {
        path: 'models',
      },
    }),
    createSwaggerSWR({
      output: {
        path: './hooks',
      },
    }),
  ],
})
