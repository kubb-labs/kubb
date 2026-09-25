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
  it('runs one job at a time with no memory budget when nothing is set', () => {
    expect(resolveAgentCapacity({})).toStrictEqual({ maxConcurrent: 1, memoryBudgetMb: undefined })
  })

  it('reads the concurrency and memory budget from the environment, ignoring invalid values', () => {
    expect(resolveAgentCapacity({ KUBB_AGENT_MAX_CONCURRENT: '2', KUBB_AGENT_MEMORY_BUDGET_MB: '1024' })).toStrictEqual({
      maxConcurrent: 2,
      memoryBudgetMb: 1024,
    })
    expect(resolveAgentCapacity({ KUBB_AGENT_MAX_CONCURRENT: '0', KUBB_AGENT_MEMORY_BUDGET_MB: 'lots' })).toStrictEqual({
      maxConcurrent: 1,
      memoryBudgetMb: undefined,
    })
  })
})
