import { getDiagnosticInfo } from './diagnostics.ts'

describe('diagnostics', () => {
  it('should return diagnostic information', () => {
    const info = getDiagnosticInfo()

    expect(info).toBeDefined()
    expect(info.nodeVersion).toBeDefined()
    expect(typeof info.nodeVersion).toBe('string')
    expect(info.KubbVersion).toBeDefined()
    expect(typeof info.KubbVersion).toBe('string')
    expect(info.platform).toBeDefined()
    expect(typeof info.platform).toBe('string')
    expect(info.arch).toBeDefined()
    expect(typeof info.arch).toBe('string')
    expect(info.cwd).toBeDefined()
    expect(typeof info.cwd).toBe('string')
  })

  it('should return consistent values', () => {
    const info1 = getDiagnosticInfo()
    const info2 = getDiagnosticInfo()

    expect(info1.nodeVersion).toBe(info2.nodeVersion)
    expect(info1.KubbVersion).toBe(info2.KubbVersion)
    expect(info1.platform).toBe(info2.platform)
    expect(info1.arch).toBe(info2.arch)
    expect(info1.cwd).toBe(info2.cwd)
  })
})
