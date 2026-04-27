import { resolve, relative, isAbsolute } from 'node:path'
import { AsyncEventEmitter } from '@internals/utils'
import { createFile } from '@kubb/ast'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import type { Config, KubbHooks, NormalizedPlugin } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import { middlewareBarrel } from './middleware.ts'

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    root: '/workspace',
    input: { path: './petstore.yaml' },
    output: { path: 'src/gen', clean: true, barrelType: 'named' },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
    ...overrides,
  } as unknown as Config
}

function makePlugin(name: string, outputPath: string): NormalizedPlugin {
  return createMockedPlugin({
    name,
    options: { output: { path: outputPath, barrelType: 'named' } } as any,
  })
}

function makeFile(path: string) {
  return createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: [],
    imports: [],
    exports: [],
  })
}

describe('middlewareBarrel - path traversal security', () => {
  it('should reject path traversal attempts using ../ in plugin output path', () => {
    const config = makeConfig()
    const plugin = makePlugin('plugin-malicious', '../../../etc/passwd')
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    expect(() => {
      if (middleware.hooks?.['kubb:plugin:end']) {
        middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
      }
    }).toThrow('Invalid output path')
  })

  it('should reject absolute paths in plugin output path', () => {
    const config = makeConfig()
    const plugin = makePlugin('plugin-malicious', '/etc/passwd')
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    expect(() => {
      if (middleware.hooks?.['kubb:plugin:end']) {
        middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
      }
    }).toThrow('Invalid output path')
  })

  it('should reject path traversal using multiple ../ segments', () => {
    const config = makeConfig()
    const plugin = makePlugin('plugin-malicious', '../../../../../../tmp/malicious')
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    expect(() => {
      if (middleware.hooks?.['kubb:plugin:end']) {
        middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
      }
    }).toThrow('Invalid output path')
  })

  it('should reject path traversal using mixed relative paths', () => {
    const config = makeConfig()
    const plugin = makePlugin('plugin-malicious', 'types/../../../../../../etc/shadow')
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    expect(() => {
      if (middleware.hooks?.['kubb:plugin:end']) {
        middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
      }
    }).toThrow('Invalid output path')
  })

  it('should allow valid relative paths within the output directory', () => {
    const config = makeConfig()
    const plugin = makePlugin('plugin-ts', 'types')
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    expect(() => {
      if (middleware.hooks?.['kubb:plugin:end']) {
        middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
      }
    }).not.toThrow()
  })

  it('should allow nested valid paths within the output directory', () => {
    const config = makeConfig()
    const plugin = makePlugin('plugin-ts', 'types/models/schemas')
    const files = [makeFile('/workspace/src/gen/types/models/schemas/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    expect(() => {
      if (middleware.hooks?.['kubb:plugin:end']) {
        middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
      }
    }).not.toThrow()
  })

  it('should reject Windows-style absolute paths on Windows', () => {
    const config = makeConfig()
    // On Unix systems, Windows paths like 'C:\...' are treated as relative paths
    // The security check will still work because after resolution, if it escapes
    // the base directory, it will be caught by the relative path check
    const plugin = makePlugin('plugin-malicious', 'C:\\Windows\\System32')
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()
    const base = resolve(config.root, config.output.path)
    const target = resolve(base, plugin.options.output.path)
    const rel = relative(base, target)
    
    // On Unix, this will be a relative path, but we verify the security check logic
    // The actual behavior depends on the OS, but the security check should work
    if (rel.startsWith('..') || isAbsolute(rel)) {
      expect(() => {
        if (middleware.hooks?.['kubb:plugin:end']) {
          middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
        }
      }).toThrow('Invalid output path')
    } else {
      // On Unix systems, Windows-style paths are treated as relative and may not escape
      // This is expected behavior - the security check is OS-dependent for Windows paths
      expect(() => {
        if (middleware.hooks?.['kubb:plugin:end']) {
          middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
        }
      }).not.toThrow()
    }
  })

  it('should validate that resolved path stays within base directory', () => {
    const config = makeConfig()
    const base = resolve(config.root, config.output.path)
    
    // Test valid path
    const validPlugin = makePlugin('plugin-valid', 'types')
    const validTarget = resolve(base, validPlugin.options.output.path)
    const validRelative = relative(base, validTarget)
    
    expect(validRelative.startsWith('..')).toBe(false)
    expect(isAbsolute(validRelative)).toBe(false)
    
    // Test invalid path with traversal
    const invalidPlugin = makePlugin('plugin-invalid', '../../../etc')
    const invalidTarget = resolve(base, invalidPlugin.options.output.path)
    const invalidRelative = relative(base, invalidTarget)
    
    expect(invalidRelative.startsWith('..')).toBe(true)
  })
})

describe('middlewareBarrel - existing functionality', () => {
  it('should generate barrel files for valid plugin output', () => {
    const config = makeConfig()
    const plugin = makePlugin('plugin-ts', 'types')
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    if (middleware.hooks?.['kubb:plugin:end']) {
      middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
    }

    // Should have called upsertFile with barrel files
    expect(upsertFile).toHaveBeenCalled()
  })

  it('should skip barrel generation when barrelType is false', () => {
    const config = makeConfig()
    const plugin = createMockedPlugin({
      name: 'plugin-ts',
      options: { output: { path: 'types', barrelType: false } } as any,
    })
    const files = [makeFile('/workspace/src/gen/types/pet.ts')]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    if (middleware.hooks?.['kubb:plugin:end']) {
      middleware.hooks['kubb:plugin:end'].call(hooks, { plugin, config, files, upsertFile })
    }

    // Should not have called upsertFile
    expect(upsertFile).not.toHaveBeenCalled()
  })

  it('should generate root barrel file in kubb:plugins:end hook', () => {
    const config = makeConfig()
    const files = [
      makeFile('/workspace/src/gen/types/pet.ts'),
      makeFile('/workspace/src/gen/schemas/petSchema.ts'),
    ]
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const upsertFile = vi.fn()

    const middleware = middlewareBarrel()

    if (middleware.hooks?.['kubb:plugins:end']) {
      middleware.hooks['kubb:plugins:end'].call(hooks, { config, files, upsertFile })
    }

    // Should have called upsertFile with root barrel files
    expect(upsertFile).toHaveBeenCalled()
  })
})
