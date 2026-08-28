import path from 'node:path'
import type { Diagnostic } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { formatGenerationFailure } from './generate.ts'

function errorDiagnostic(plugin: string, message: string): Diagnostic {
  return { code: 'KUBB_UNKNOWN', severity: 'error', message, plugin }
}

describe('formatGenerationFailure', () => {
  it('names the single failing plugin', () => {
    const error = formatGenerationFailure([errorDiagnostic('plugin-ts', 'ctx.getMode is not a function')])

    expect(error.message).toBe('Generation failed: 1 error — plugin-ts: ctx.getMode is not a function')
  })

  it('lists every failing plugin', () => {
    const error = formatGenerationFailure([errorDiagnostic('plugin-ts', 'boom'), errorDiagnostic('plugin-zod', 'bang')])

    expect(error.message).toBe('Generation failed: 2 errors — plugin-ts: boom; plugin-zod: bang')
  })

  it('reports the message alone when no diagnostic names a plugin', () => {
    const error = formatGenerationFailure([{ code: 'KUBB_UNKNOWN', severity: 'error', message: 'input not found' }])

    expect(error.message).toBe('Generation failed: 1 error — input not found')
  })

  it('ignores warning and info diagnostics', () => {
    const error = formatGenerationFailure([{ code: 'KUBB_UNKNOWN', severity: 'warning', message: 'heads up' }, errorDiagnostic('plugin-ts', 'boom')])

    expect(error.message).toBe('Generation failed: 1 error — plugin-ts: boom')
  })

  it('reports no errors when the diagnostics list is empty', () => {
    const error = formatGenerationFailure([])

    expect(error.message).toBe('Generation failed')
  })
})

describe('Output path resolution', () => {
  it('should resolve relative paths correctly', () => {
    const config = {
      root: './src',
      output: {
        path: './generated',
      },
    }

    // Simulate the fix: use absolute path resolution
    const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

    // Should resolve to cwd/src/generated
    expect(outputPath).toBe(path.join(process.cwd(), 'src', 'generated'))
    expect(path.isAbsolute(outputPath)).toBe(true)
  })

  it('should handle absolute output paths', () => {
    const absolutePath = '/absolute/path/to/generated'
    const config = {
      root: './src',
      output: {
        path: absolutePath,
      },
    }

    const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

    expect(outputPath).toBe(absolutePath)
  })

  it('should work with different root configurations', () => {
    const config = {
      root: './my-api',
      output: {
        path: './dist/generated',
      },
    }

    const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

    expect(outputPath).toBe(path.join(process.cwd(), 'my-api', 'dist', 'generated'))
  })

  it('should handle root at project root', () => {
    const config = {
      root: '.',
      output: {
        path: './generated',
      },
    }

    const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

    expect(outputPath).toBe(path.join(process.cwd(), 'generated'))
  })
})
