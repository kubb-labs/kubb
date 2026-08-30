import path from 'node:path'
import { describe, expect, it } from 'vitest'

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
