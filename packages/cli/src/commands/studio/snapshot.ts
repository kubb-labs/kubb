import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const definition = define({
  name: 'snapshot',
  description: 'Generate and publish a Kubb Studio snapshot from CI.',
  examples: ['kubb studio snapshot', 'kubb studio snapshot --json'].join('\n'),
  toKebab: true,
  rendering: {
    header: null,
  },
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    id: {
      type: 'string',
      description: 'Stable identity for the CI agent, such as a pull request. Auto-detected on GitHub Actions, GitLab CI, Bitbucket Pipelines and CircleCI',
    },
    baseId: {
      type: 'string',
      description:
        'Identity of the CI agent to also compare with, such as the one runs on the base branch use. Auto-detected for pull requests on GitHub Actions, GitLab CI and Bitbucket Pipelines',
      toKebab: true,
    },
    name: {
      type: 'string',
      description: 'Package name for the generated tarball. Defaults to the name in package.json',
    },
    packageVersion: {
      type: 'string',
      description: 'Package version for the generated tarball. Defaults to the version in package.json',
      toKebab: true,
    },
    timeout: {
      type: 'number',
      description: 'Seconds to wait for the job to finish',
      default: 600,
    },
    json: {
      type: 'boolean',
      description: 'Print the result as one JSON object instead of a summary',
      default: false,
    },
    ...logLevelArg,
  },
})
