import { describe, expect, it } from 'vitest'
import { resolvePermissions } from './resolvePermissions.ts'

describe('resolvePermissions', () => {
  it('keeps runtime filesystem permissions when config yolo is not set', () => {
    expect(
      resolvePermissions({
        runtimeYolo: false,
        runtimeFilesystem: 'read',
        configPermissions: {
          filesystem: 'none',
        },
      }),
    ).toEqual({
      yolo: false,
      filesystem: 'read',
    })
  })

  it('grants write to active permissions when config yolo is true', () => {
    expect(
      resolvePermissions({
        runtimeYolo: false,
        runtimeFilesystem: 'none',
        configPermissions: {
          yolo: true,
        },
      }),
    ).toEqual({
      yolo: true,
      filesystem: 'write',
    })
  })

  it('allows specific permissions to override config yolo defaults', () => {
    expect(
      resolvePermissions({
        runtimeYolo: false,
        runtimeFilesystem: 'none',
        configPermissions: {
          yolo: true,
          filesystem: 'none',
        },
      }),
    ).toEqual({
      yolo: true,
      filesystem: 'none',
    })
  })
})
