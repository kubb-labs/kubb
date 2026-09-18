import { define, lazy } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'
import { definition as connectDefinition } from './connect.ts'
import { definition as loginDefinition } from './login.ts'
import { definition as logoutDefinition } from './logout.ts'
import { definition as snapshotDefinition } from './snapshot.ts'
import { definition as statusDefinition } from './status.ts'
import { definition as publishDefinition } from './publish.ts'

export const definition = define({
  name: 'studio',
  description: 'Connect this project to Kubb Studio, or manage its pairing and snapshots.',
  examples: ['kubb studio', 'kubb studio --allow-read', 'kubb studio login', 'kubb studio status', 'kubb studio logout', 'kubb studio snapshot'].join('\n'),
  toKebab: true,
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    open: {
      type: 'boolean',
      description: 'Open the approval page in a browser while pairing',
      default: true,
      negatable: true,
    },
    ...logLevelArg,
  },
  async run(ctx) {
    const { runner } = await import('../../runners/studio/connect.ts')
    await runner(ctx)
  },
  subCommands: {
    connect: lazy(async () => (await import('../../runners/studio/connect.ts')).runner, connectDefinition),
    login: lazy(async () => (await import('../../runners/studio/login.ts')).runner, loginDefinition),
    logout: lazy(async () => (await import('../../runners/studio/logout.ts')).runner, logoutDefinition),
    status: lazy(async () => (await import('../../runners/studio/status.ts')).runner, statusDefinition),
    snapshot: lazy(async () => (await import('../../runners/studio/snapshot.ts')).runner, snapshotDefinition),
    publish: lazy(async () => (await import('../../runners/studio/publish.ts')).runner, publishDefinition),
  },
})
