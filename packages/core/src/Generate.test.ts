import { createFile } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { FileManager } from './FileManager.ts'
import { Generate } from './Generate.ts'
import type { KubbDriver } from './KubbDriver.ts'

function driverWithFileManager(): { driver: KubbDriver; fileManager: FileManager } {
  const fileManager = new FileManager()
  const driver = { fileManager } as unknown as KubbDriver
  return { driver, fileManager }
}

function file(name: string): FileNode {
  return createFile({ baseName: `${name}.ts`, path: `${name}.ts` })
}

describe('Generate.apply', () => {
  it('does nothing on null, undefined, or false-y results', () => {
    const { driver, fileManager } = driverWithFileManager()
    const upsert = vi.spyOn(fileManager, 'upsert')

    Generate.apply({ result: null, driver })
    Generate.apply({ result: undefined, driver })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('upserts every file when the result is an Array<FileNode>', () => {
    const { driver, fileManager } = driverWithFileManager()
    const files = [file('a'), file('b')]

    Generate.apply({ result: files, driver })

    expect(fileManager.files).toHaveLength(2)
    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['a', 'b'])
  })

  it('ignores non-array results when no rendererFactory is provided', () => {
    const { driver, fileManager } = driverWithFileManager()
    const upsert = vi.spyOn(fileManager, 'upsert')

    Generate.apply({ result: { kind: 'element' }, driver })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('routes element results through the rendererFactory stream when present', () => {
    const { driver, fileManager } = driverWithFileManager()
    const rendered = [file('rendered-1'), file('rendered-2')]
    const rendererFactory = vi.fn(() => ({
      stream: vi.fn(function* () {
        yield* rendered
      }),
      [Symbol.dispose]: () => {},
    }))

    Generate.apply({ result: { kind: 'element' }, driver, rendererFactory: rendererFactory as never })

    expect(rendererFactory).toHaveBeenCalledOnce()
    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['rendered-1', 'rendered-2'])
  })

  it('routes element results through the async render path when no stream is exposed', async () => {
    const { driver, fileManager } = driverWithFileManager()
    const renderer = {
      render: vi.fn(async () => {}),
      files: [file('async-1')],
      [Symbol.dispose]: () => {},
    }
    const rendererFactory = vi.fn(() => renderer)

    const result = Generate.apply({ result: { kind: 'element' }, driver, rendererFactory: rendererFactory as never })
    await result

    expect(renderer.render).toHaveBeenCalledOnce()
    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['async-1'])
  })
})
