import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readStudioConfig, writeStudioConfig } from './studioConfig.ts'

let tmpDir: string
let configPath: string

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), 'kubb-studio-config-test-'))
  configPath = path.join(tmpDir, 'kubb.config.ts')
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('readStudioConfig', () => {
  it('returns null when the studio config file does not exist', () => {
    expect(readStudioConfig(configPath)).toBeNull()
  })

  it('returns parsed config when the studio config file exists', () => {
    const config = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }
    writeFileSync(path.join(tmpDir, 'kubb.config.studio.json'), JSON.stringify(config), 'utf-8')

    expect(readStudioConfig(configPath)).toEqual(config)
  })

  it('returns null when the studio config file contains invalid JSON', () => {
    writeFileSync(path.join(tmpDir, 'kubb.config.studio.json'), '{ invalid json }', 'utf-8')

    expect(readStudioConfig(configPath)).toBeNull()
  })

  it('reads the config from the same directory as the provided configPath', () => {
    const config = { plugins: [] }
    writeFileSync(path.join(tmpDir, 'kubb.config.studio.json'), JSON.stringify(config), 'utf-8')

    // configPath can point to any file in the dir; only dirname is used
    expect(readStudioConfig(path.join(tmpDir, 'some-other-file.json'))).toEqual(config)
  })
})

describe('writeStudioConfig', () => {
  it('writes the config as formatted JSON to kubb.config.studio.json', () => {
    const config = { plugins: [{ name: '@kubb/plugin-zod', options: { output: { path: './schemas' } } }] }

    writeStudioConfig(configPath, config)

    expect(readStudioConfig(configPath)).toEqual(config)
  })

  it('overwrites an existing studio config file', () => {
    const initial = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }
    const updated = { plugins: [{ name: '@kubb/plugin-zod', options: {} }] }

    writeStudioConfig(configPath, initial)
    writeStudioConfig(configPath, updated)

    expect(readStudioConfig(configPath)).toEqual(updated)
  })

  it('writes to the same directory as the provided configPath', async () => {
    const config = { plugins: [] }
    const altConfigPath = path.join(tmpDir, 'nested', 'kubb.config.ts')

    // Create the nested directory first
    const { mkdirSync } = await import('node:fs')
    mkdirSync(path.dirname(altConfigPath), { recursive: true })

    writeStudioConfig(altConfigPath, config)

    expect(readStudioConfig(altConfigPath)).toEqual(config)
  })
})
