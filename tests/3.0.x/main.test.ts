import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AsyncEventEmitter, getRelativePath } from '@internals/utils'
import { type KubbEvents, safeBuild, type UserConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

const configs: Array<{ name: string; config: UserConfig }> = [
  {
    name: 'simple',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/petStore.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    name: 'petStore',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/petStore.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
          discriminator: 'inherit',
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    name: 'discriminatorAllOf',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/discriminatorAllOf.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    name: 'discriminatorAnyOf',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/discriminatorAnyOf.yaml',
      },
      output: {
        path: './gen',
        clean: true,
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
        }),
        pluginTs({}),
      ],
    },
  },
  {
    name: 'discriminatorOneOf',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/discriminatorOneOf.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    name: 'caseSensitivity',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/caseSensitivity.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
          collisionDetection: true,
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    name: 'duplicateEnum',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/duplicateEnum.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
          collisionDetection: true,
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    /**
     * Regression test for https://github.com/kubb-labs/kubb/issues/2619
     *
     * When a main spec delegates requestBodies and responses to an external file, all schemas
     * defined in that external file (e.g. Parcel, Result) should get their own separate Zod
     * schema files instead of being inlined or self-referencing (`z.lazy(() => parcelSchema)`).
     */
    name: 'issue2619',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/external-refs/returns/main.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
        }),
        pluginZod({
          output: {
            path: './zod',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    /**
     * Regression test for https://github.com/kubb-labs/kubb/issues/2730
     *
     * When components.schemas has an entry that is itself a $ref to an external file
     * (e.g. `Parcel: { $ref: "api-definitions.yaml#/components/schemas/Parcel" }`),
     * kubb must NOT produce "Maximum call stack size exceeded". Instead it should
     * generate a single Parcel schema file and reference it correctly.
     */
    name: 'issue2730',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/external-refs/component-ref/main.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
        }),
        pluginZod({
          output: {
            path: './zod',
            barrelType: false,
          },
        }),
      ],
    },
  },
  {
    /**
     * Regression test for https://github.com/kubb-labs/kubb/issues/2696
     *
     * When path operations use external path-item $refs (e.g. `$ref: './paths/me.yaml'`) and
     * components.schemas also reference the same external schema files, pluginTs must NOT
     * generate phantom imports like `import type { Me } from "./Me.ts"` (derived from the path
     * segment) or `import type { Items }` (derived from the array keyword). It should correctly
     * use `User` and `Employer` as derived from the actual schema file names.
     */
    name: 'issue2696',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/external-refs/phantom/main.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          validate: false,
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
        }),
      ],
    },
  },
]

describe(`Main OpenAPI ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, failedPlugins, error } = await safeBuild({
      config: {
        ...config,
        output: {
          ...config.output,
          path: output,
        },
      },
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(files.length).toBeGreaterThan(1)
    expect(failedPlugins.size).toBe(0)
    expect(error).toBeUndefined()

    await Promise.all(
      files.map(async (file) => {
        const fileContent = await fs.readFile(file.path, 'utf-8')
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', name, getRelativePath(output, file.path)))
      }),
    )

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
