import { describe, expect, it } from 'vitest'
import type { ConfigPermissions } from './types.ts'

describe('ConfigPermissions', () => {
  it('accepts direct filesystem grants', () => {
    const permissions = {
      filesystem: 'write',
    } satisfies ConfigPermissions

    expect(permissions.filesystem).toBe('write')
  })

  it('accepts yolo-only grants and explicit overrides', () => {
    const yoloPermissions = {
      yolo: true,
    } satisfies ConfigPermissions

    const customizedPermissions = {
      yolo: true,
      filesystem: 'none',
    } satisfies ConfigPermissions

    expect(yoloPermissions.yolo).toBe(true)
    expect(customizedPermissions.filesystem).toBe('none')
  })

  it('rejects unsupported permission shapes at compile time', () => {
    // @ts-expect-error `yolo` can only be `true` when provided.
    const invalidYolo = { yolo: false } satisfies ConfigPermissions
    // @ts-expect-error Future permission names are ADR-only and not part of runtime config yet.
    const invalidFuturePermission = { network: 'write' } satisfies ConfigPermissions

    expect(invalidYolo).toBeDefined()
    expect(invalidFuturePermission).toBeDefined()
  })
})
