import { describe, expect, it } from 'vitest'
import { agentDefaults, resolveGenerationLimits } from './constants.ts'

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

  it('ignores a value that is not a positive number', () => {
    expect(resolveGenerationLimits({ KUBB_AGENT_MAX_GENERATIONS: '0', KUBB_AGENT_MAX_GENERATIONS_MB: 'lots', KUBB_AGENT_MAX_SNAPSHOT_MB: '-1' })).toStrictEqual(
      {
        maxCount: agentDefaults.maxGenerations,
        maxMb: agentDefaults.maxGenerationsMb,
        maxSnapshotMb: agentDefaults.maxSnapshotMb,
      },
    )
  })
})
