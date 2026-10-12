import { ast } from '@kubb/ast'
import { type Config, definePlugin, fsStorage, memoryStorage, type Plugin } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'

export const root = '/project'

/**
 * A project whose one plugin injects `src/gen/pet.ts`, named `plugin-barrel` so a snapshot can resolve its package.
 * It generates in memory unless `projectRoot` names a real folder.
 */
export function projectConfig({ content = 'export const pet = 1', projectRoot }: { content?: string; projectRoot?: string } = {}): Config {
  const file = ast.factory.createFile({
    path: `${projectRoot ?? root}/src/gen/pet.ts`,
    baseName: 'pet.ts',
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(content)] })],
    imports: [],
    exports: [],
  })
  const plugin: Plugin = definePlugin({
    meta: { name: 'plugin-barrel' },
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.injectFile(file)
      },
    },
  })()

  return {
    root: projectRoot ?? root,
    input: 'https://example.com/openapi.json',
    output: { path: 'src/gen', clean: false },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [plugin],
    storage: projectRoot ? fsStorage() : memoryStorage(),
  } as unknown as Config
}
