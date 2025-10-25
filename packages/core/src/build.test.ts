import { build } from './build.ts'
import type { KubbFile } from './fs/index.ts'
import { createPlugin } from './plugin.ts'
import type { Config, Plugin } from './types.ts'

describe('build', () => {
  const pluginMocks = {
    buildStart: vi.fn(),
    buildEnd: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file: KubbFile.File = {
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [{ value: `{ "hello": "world" }` }],
  }
  const plugin = createPlugin(() => {
    return {
      name: 'plugin',
      options: undefined as any,
      context: undefined as never,
      key: ['plugin'],
      async buildStart(...params) {
        pluginMocks.buildStart(...params)

        await this.addFile(file)
      },
      buildEnd(...params) {
        pluginMocks.buildEnd(...params)
      },
    }
  })

  const config = {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [plugin({})] as Plugin[],
  } satisfies Config

  afterEach(() => {
    Object.keys(pluginMocks).forEach((key) => {
      const mock = pluginMocks[key as keyof typeof pluginMocks]

      mock.mockClear()
    })
  })

  test('if build can run and return created files and the pluginManager', async () => {
    const { app, pluginManager } = await build({
      config,
    })

    await app.addFile(file)

    expect(app.files).toBeDefined()
    expect(pluginManager).toBeDefined()
    expect(app.files.length).toBe(1)
  })

  test('if build with one plugin is running the different hooks in the correct order', async () => {
    const { app } = await build({
      config,
    })

    await app.addFile(file)

    expect(app.files.map((file) => ({ ...file, id: undefined, path: undefined }))).toMatchInlineSnapshot(`
      [
        {
          "baseName": "world.json",
          "exports": [],
          "extname": ".json",
          "id": undefined,
          "imports": [],
          "meta": {},
          "name": "world",
          "path": undefined,
          "sources": [
            {
              "value": "{ "hello": "world" }",
            },
          ],
        },
      ]
    `)

    expect(pluginMocks.buildStart).toHaveBeenCalledTimes(1)
    expect(pluginMocks.buildEnd).toHaveBeenCalledTimes(1)
  })
})
