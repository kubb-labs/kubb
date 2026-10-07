import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectPackageManager } from './tools.ts'

describe('detectPackageManager', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'kubb-pm-'))
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('prefers the packageManager field over lock files', () => {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.0.0' }))
    writeFileSync(join(cwd, 'pnpm-lock.yaml'), '')

    expect(detectPackageManager(cwd).name).toBe('yarn')
  })

  it.each(['bun.lock', 'bun.lockb'])('detects bun from %s', (lockFile) => {
    writeFileSync(join(cwd, lockFile), '')

    expect(detectPackageManager(cwd).name).toBe('bun')
  })

  it('falls back to npm when nothing is found', () => {
    expect(detectPackageManager(cwd).name).toBe('npm')
  })
})
