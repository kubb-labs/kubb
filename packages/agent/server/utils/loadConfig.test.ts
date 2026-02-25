import { describe, expect, it, vi } from 'vitest'
import { loadConfig } from './loadConfig.ts'

vi.mock('./getCosmiConfig.ts', () => ({
  getCosmiConfig: vi.fn(),
}))

vi.mock('@kubb/core/utils', async (importOriginal) => ({
  ...(await importOriginal()),
  getConfigs: vi.fn(),
}))

import { getCosmiConfig } from './getCosmiConfig.ts'
import { getConfigs } from '@kubb/core/utils'

describe('loadConfig', () => {
  it('returns the first config when multiple configs are found', async () => {
    const first = { name: 'first', input: { path: 'spec.yaml' }, output: { path: './gen' }, plugins: [] }
    const second = { name: 'second', input: { path: 'spec.yaml' }, output: { path: './gen' }, plugins: [] }

    vi.mocked(getCosmiConfig).mockResolvedValue({ config: {} } as any)
    vi.mocked(getConfigs).mockResolvedValue([first, second] as any)

    expect(await loadConfig('/project/kubb.config.ts')).toBe(first)
  })

  it('throws when no configs are found', async () => {
    vi.mocked(getCosmiConfig).mockResolvedValue({ config: {} } as any)
    vi.mocked(getConfigs).mockResolvedValue([])

    await expect(loadConfig('/project/kubb.config.ts')).rejects.toThrow('No configs found')
  })

  it('passes the resolved config path to getCosmiConfig', async () => {
    const configPath = '/absolute/project/kubb.config.ts'

    vi.mocked(getCosmiConfig).mockResolvedValue({ config: {} } as any)
    vi.mocked(getConfigs).mockResolvedValue([{ name: 'test' }] as any)

    await loadConfig(configPath)

    expect(getCosmiConfig).toHaveBeenCalledWith(configPath)
  })

  it('passes the cosmiconfig result to getConfigs', async () => {
    const cosmiResult = { config: { input: { path: 'api.yaml' } } }

    vi.mocked(getCosmiConfig).mockResolvedValue(cosmiResult as any)
    vi.mocked(getConfigs).mockResolvedValue([{ name: 'test' }] as any)

    await loadConfig('/project/kubb.config.ts')

    expect(getConfigs).toHaveBeenCalledWith(cosmiResult.config, {})
  })
})
