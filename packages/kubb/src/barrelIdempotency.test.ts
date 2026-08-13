import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ast } from '@kubb/ast'
import { createKubb, definePlugin, fsStorage } from '@kubb/core'
import type { Config, Plugin } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginBarrel } from '@kubb/plugin-barrel'
import { afterAll, describe, expect, it, vi } from 'vitest'

const roots: Array<string> = []

afterAll(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true })
})

function makeTypeFile(filePath: string, name: string) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: [
      ast.factory.createSource({
        name,
        isIndexable: true,
        isTypeOnly: true,
        nodes: [ast.factory.createText(`export type ${name} = { id: number }`)],
      }),
    ],
    imports: [],
    exports: [],
  })
}

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-barrel-'))
  roots.push(root)

  const makeConfig = ({ names = ['Pet', 'Owner'], storage = fsStorage() }: { names?: Array<string>; storage?: Config['storage'] } = {}) =>
    ({
      root,
      output: { path: 'gen', barrel: { type: 'named' }, clean: false, format: false, lint: false },
      parsers: [parserTs()],
      reporters: [],
      storage,
      plugins: [
        definePlugin(() => ({
          name: 'plugin-types',
          hooks: {
            'kubb:plugin:setup'(ctx) {
              ctx.setOptions({ output: { path: 'types', mode: 'directory' } })
              ctx.setResolver({})
              for (const name of names) ctx.injectFile(makeTypeFile(path.join(root, `gen/types/${name}.ts`), name))
            },
          },
        }))(),
        pluginBarrel(),
      ] as unknown as Array<Plugin>,
    }) satisfies Config

  return {
    makeConfig,
    rootBarrel: path.join(root, 'gen/index.ts'),
    typesBarrel: path.join(root, 'gen/types/index.ts'),
  }
}

// A barrel is assembled after every plugin has run, which historically put it on a different write
// path than the generated modules and rewrote it on every build. Watchers on the output treat that
// as a change and re-compile. See https://github.com/kubb-labs/kubb/issues/3867.
describe('barrel write idempotency', () => {
  it('leaves both barrels untouched on an identical second build', async () => {
    const { makeConfig, rootBarrel, typesBarrel } = makeProject()

    await createKubb(makeConfig()).build()

    const before = {
      root: fs.statSync(rootBarrel).mtimeMs,
      types: fs.statSync(typesBarrel).mtimeMs,
      content: fs.readFileSync(typesBarrel, 'utf-8'),
    }

    // Long enough that a rewrite would move mtime, which is what the issue reports watchers seeing.
    await new Promise((done) => setTimeout(done, 10))
    const storage = fsStorage()
    const writeItem = vi.spyOn(storage, 'writeItem')
    await createKubb(makeConfig({ storage })).build()

    expect(writeItem).not.toHaveBeenCalled()
    expect(fs.statSync(rootBarrel).mtimeMs).toBe(before.root)
    expect(fs.statSync(typesBarrel).mtimeMs).toBe(before.types)
    expect(fs.readFileSync(typesBarrel, 'utf-8')).toBe(before.content)
  })

  it('leaves a barrel untouched on a rebuild after a formatter reflowed it', async () => {
    const { makeConfig, rootBarrel, typesBarrel } = makeProject()

    // Stands in for prettier or biome on a config that disagrees with Kubb's style: reflows the
    // barrels Kubb wrote, and leaves an already-reflowed one alone.
    const processOutput = async () => {
      for (const barrel of [rootBarrel, typesBarrel]) {
        const current = fs.readFileSync(barrel, 'utf-8')
        const reflowed = current.replaceAll('"', "'")
        if (current !== reflowed) fs.writeFileSync(barrel, reflowed, { encoding: 'utf-8' })
      }
      return []
    }

    const first = await createKubb(makeConfig()).generate({ processOutput })
    const before = { types: fs.statSync(typesBarrel).mtimeMs, content: fs.readFileSync(typesBarrel, 'utf-8') }

    await new Promise((done) => setTimeout(done, 10))
    const second = await createKubb(makeConfig()).generate({ processOutput })

    // `generate` reports failures instead of throwing, so an unchecked build that died halfway
    // would leave the barrel untouched and pass every assertion below for the wrong reason.
    expect([first.success, second.success]).toStrictEqual([true, true])
    expect(fs.readFileSync(typesBarrel, 'utf-8')).toBe(before.content)
    expect(fs.statSync(typesBarrel).mtimeMs).toBe(before.types)
  })

  it('rewrites a barrel when a generated module changed its exports', async () => {
    const { makeConfig, typesBarrel } = makeProject()

    await createKubb(makeConfig()).build()
    const before = fs.readFileSync(typesBarrel, 'utf-8')
    expect(before).toContain('Owner')

    await createKubb(makeConfig({ names: ['Pet'] })).build()

    expect(fs.readFileSync(typesBarrel, 'utf-8')).not.toBe(before)
    expect(fs.readFileSync(typesBarrel, 'utf-8')).not.toContain('Owner')
  })
})
