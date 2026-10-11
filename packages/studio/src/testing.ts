import { ast } from '@kubb/ast'
import { type Config, definePlugin, memoryStorage, type Plugin } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'

export const root = '/project'

/**
 * A project whose one plugin injects `src/gen/pet.ts`, named `plugin-barrel` so a snapshot can resolve its package.
 */
export function projectConfig(content = 'export const pet = 1'): Config {
  const file = ast.factory.createFile({
    path: `${root}/src/gen/pet.ts`,
    baseName: 'pet.ts',
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(content)] })],
    imports: [],
    exports: [],
  })
  const plugin = definePlugin(() => ({
    name: 'plugin-barrel',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.injectFile(file)
      },
    },
  }))() as unknown as Plugin

  return {
    root,
    input: 'https://example.com/openapi.json',
    output: { path: 'src/gen', clean: false },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [plugin],
    storage: memoryStorage(),
  } as unknown as Config
}
