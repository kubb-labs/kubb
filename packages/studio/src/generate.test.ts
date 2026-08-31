import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('output path resolution', () => {
  it('resolves relative paths', () => {
    const config = {
      root: './src',
      output: {
        path: './generated',
      },
    }

    const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

    expect(outputPath).toBe(path.join(process.cwd(), 'src', 'generated'))
    expect(path.isAbsolute(outputPath)).toBe(true)
  })

  it('handles absolute output paths', () => {
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

  it('works with different root configurations', () => {
    const config = {
      root: './my-api',
      output: {
        path: './dist/generated',
      },
    }

    const outputPath = path.isAbsolute(config.output.path) ? config.output.path : path.resolve(process.cwd(), config.root, config.output.path)

    expect(outputPath).toBe(path.join(process.cwd(), 'my-api', 'dist', 'generated'))
  })

  it('handles root at project root', () => {
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
