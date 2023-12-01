import { defineConfig } from '@kubb/core'

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
      ['@kubb/swagger', {
        output: false,
      }],
      ['@kubb/swagger-ts', {
        output: {
          path: 'models',
        },
      }],
      ['@kubb/swagger-faker', {
        output: {
          path: './mocks',
          exportType: false,
        },
        group: { type: 'tag', output: './mocks/{{tag}}Mocks' },
      }],
      ['@kubb/swagger-msw', {
        output: {
          path: './msw',
        },
        group: { type: 'tag', output: './msw/{{tag}}Handlers' },
      }],
    ],
  }
})
