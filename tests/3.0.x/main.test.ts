import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AsyncEventEmitter, getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      output: {
        path: './gen',
        barrelType: false,
      },
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
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
      adapter: adapterOas({ collisionDetection: false, validate: false, discriminator: 'inherit' }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({ legacy: true }),
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
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
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
        }),
      ],
    },
  },
  {
    /**
     * Regression test for Bug 1: allOf with a single $ref overrides node.name
     * to the property name, causing `type content = content` instead of
     * `type content = TestContent`.
     */
    name: 'allOfRefOverride',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/allOfRefOverride.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
        }),
      ],
    },
  },
  {
    /**
     * Regression test for Bug 2: discriminator on a parent schema maps back to
     * child schemas via allOf + $ref, creating circular references that produced
     * self-referential types (e.g. `type DisconnectedProblem = DisconnectedProblem`).
     */
    name: 'circularDiscriminator',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/circularDiscriminator.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          legacy: true,
        }),
      ],
    },
  },
  {
    /**
     * Regression test for Bug 3: with enumType='asConst', enum files must export
     * a PascalCase type alias (e.g. `export type Status = StatusKey`) so that
     * other files importing the PascalCase name resolve correctly.
     */
    name: 'asConstEnum',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/asConstEnum.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          enumType: 'asConst',
          legacy: true,
        }),
      ],
    },
  },
  {
    /**
     * Regression test for Bug 4: operations with no tags + operationIds containing
     * version-like dots (e.g. v2025.0) that should not be split into path segments.
     */
    name: 'noTagsDotOperationId',
    config: {
      root: __dirname,
      input: {
        path: '../../schemas/3.0.x/noTagsDotOperationId.yaml',
      },
      output: {
        path: './gen',
        barrelType: false,
      },
      adapter: adapterOas({ collisionDetection: false, validate: false }),
      plugins: [
        pluginOas({
          generators: [],
        }),
        pluginTs({
          output: {
            path: './types',
            barrelType: false,
          },
          group: { type: 'tag' },
          legacy: true,
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
