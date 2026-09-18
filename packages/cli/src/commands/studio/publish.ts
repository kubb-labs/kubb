import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const definition = define({
  name: 'publish',
  description: 'Publish a Kubb Studio snapshot to npm from this machine.',
  examples: ['kubb studio publish', 'kubb studio publish --snapshot-id <id>', 'kubb studio publish --snapshot-id <id> --json'].join('\n'),
  toKebab: true,
  rendering: { header: null },
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    id: { type: 'string', description: 'Stable identity for the CI agent' },
    snapshotId: { type: 'string', description: 'Snapshot id to publish, skipping the picker', toKebab: true },
    timeout: { type: 'number', description: 'Seconds to wait for the job to finish', default: 600 },
    json: { type: 'boolean', description: 'Print the result as one JSON object instead of a summary', default: false },
    ...logLevelArg,
  },
})
