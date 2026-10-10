import { describe, expect, it } from 'vitest'
import { agentDefaults, resolveAgentCapacity, resolveGenerationLimits } from './constants.ts'

describe('resolveGenerationLimits', () => {
  it('keeps the defaults when nothing is set', () => {
    expect(resolveGenerationLimits({})).toStrictEqual({
      maxCount: agentDefaults.maxGenerations,
      maxMb: agentDefaults.maxGenerationsMb,
      maxSnapshotMb: agentDefaults.maxSnapshotMb,
    })
  })

  it('reads each limit from its environment variable, in MB', () => {
    expect(
      resolveGenerationLimits({ KUBB_AGENT_MAX_GENERATIONS: '3', KUBB_AGENT_MAX_GENERATIONS_MB: '250', KUBB_AGENT_MAX_SNAPSHOT_MB: '12.5' }),
    ).toStrictEqual({ maxCount: 3, maxMb: 250, maxSnapshotMb: 12.5 })
  })
})

describe('resolveAgentCapacity', () => {
  it.each([
    ['nothing is set', {}, 1],
    ['the environment asks for 2', { KUBB_AGENT_MAX_CONCURRENT: '2' }, 2],
    ['the environment holds an invalid value', { KUBB_AGENT_MAX_CONCURRENT: '0' }, 1],
  ])('returns maxConcurrent when %s', (_label, env, maxConcurrent) => {
    expect(resolveAgentCapacity(env)).toStrictEqual({ maxConcurrent })
  })
})
