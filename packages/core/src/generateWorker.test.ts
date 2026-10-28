import { Worker } from 'node:worker_threads'
import { expect, test } from 'vitest'
import { createFixtureConfig, operations, schemas } from './generateWorker.fixture.ts'
import { Hookable } from './Hookable.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { KubbHooks } from './types.ts'

// The threads run the built package: `@kubb/core` resolves to `dist` outside Vitest.
const fixture = new URL('./generateWorker.fixture.ts', import.meta.url)

async function build(workers?: number) {
  const hooks = new Hookable<KubbHooks>()
  const generated: Array<string> = []
  hooks.hook('kubb:generate:schema', (node) => void generated.push(node.name!))
  hooks.hook('kubb:generate:operation', (node) => void generated.push(node.operationId))
  const driver = new KubbDriver(createFixtureConfig(), { hooks, workers: workers ? { count: workers, spawn: () => new Worker(fixture) } : undefined })
  await driver.setup()
  const { diagnostics } = await driver.run()
  return { files: driver.fileManager.files, diagnostics, generated }
}

test('generating by node range over worker threads matches one walk', async () => {
  const single = await build()
  const split = await build(3)
  expect(single.diagnostics.filter((diagnostic) => diagnostic.kind !== 'performance' && diagnostic.severity === 'error')).toStrictEqual([])

  expect(split.files).toStrictEqual(single.files)
  const names = Object.fromEntries(single.files.map((file) => [file.baseName, file.sources.map((source) => source.name)]))
  expect(names).toStrictEqual({
    ...Object.fromEntries(schemas.map((_, index) => [`model${index}.ts`, [index === 0 ? 'shared' : `shared${index + 1}`]])),
    'operations.ts': operations.map((_, index) => `shared${schemas.length + index + 1}`),
    'all.ts': [`shared${schemas.length + operations.length + 1}`],
  })
  // Observers see every node on the main thread, in walk order, and a thread's warning reaches the run.
  expect(split.generated).toStrictEqual(single.generated)
  expect(split.diagnostics.filter((diagnostic) => diagnostic.kind !== 'performance')).toStrictEqual(
    single.diagnostics.filter((diagnostic) => diagnostic.kind !== 'performance'),
  )
  expect(split.diagnostics).toContainEqual(expect.objectContaining({ severity: 'warning', message: 'Model4 took shared5', plugin: 'fixture' }))
})
